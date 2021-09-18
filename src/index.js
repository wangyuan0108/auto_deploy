/*
 * @Author: wangyuan
 * @Date: 2021-05-10 15:02:46
 * @LastEditTime: 2021-09-18 11:48:07
 * @LastEditors: wangyuan
 * @Description:
 */
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');
const NodeSSH = require('node-ssh').NodeSSH;
const shell = require('shelljs');
const inquirer = require('inquirer');
const compressing = require('compressing');
const moment = require('moment');
const axios = require('axios');
const argv = require('minimist')(process.argv.slice(2));

// const CONFIG = require("./deploy.conf");

const SSH = new NodeSSH();
let config;
let workPath;
let webHookUrl;
let atMobiles = [];
const build = argv.build || false;
const defaultLog = log =>
  console.log(
    chalk.blue(
      `---------------- ${log} ${moment(new Date()).format(
        'YYYY-MM-DD HH:mm:SS',
      )} ----------------\n\n`,
    ),
  );
const errorLog = log =>
  console.log(
    chalk.red(
      `---------------- ${log} ${moment(new Date()).format(
        'YYYY-MM-DD HH:mm:SS',
      )} ----------------\n\n`,
    ),
  );
const successLog = log =>
  console.log(
    chalk.green(
      `---------------- ${log} ${moment(new Date()).format(
        'YYYY-MM-DD HH:mm:SS',
      )} ----------------\n\n`,
    ),
  );

const compileDist = async () => {
  if (build) {
    const loading = ora(defaultLog('项目开始打包')).start();
    // shell.cd(path.resolve(__dirname, "../"));
    const res = await shell.exec(`npm run ${config.script}`); //执行shell 打包命令
    loading.clear();
    if (res.code === 0) {
      successLog('项目打包成功!');
    } else {
      errorLog('项目打包失败, 请重试!');
      process.exit(); //退出流程
    }
  } else {
    successLog('项目已经打包,不需要再次打包!');
  }
};

//压缩代码
const zipDist = async () => {
  defaultLog('项目开始压缩');
  try {
    const distDir = path.resolve(workPath, `./${config.publicPath}`);
    const distZipPath = path.resolve(workPath, `./${config.publicPath}.zip`);
    await compressing.zip.compressDir(distDir, distZipPath, {
      ignoreBase: 'ignoreBase',
    });
    successLog('压缩成功!');
  } catch (error) {
    errorLog(error);
    errorLog('压缩失败, 退出程序!');
    process.exit(); //退出流程
  }
};

//连接服务器
const connectSSH = async () => {
  const loading = ora(defaultLog('正在连接服务器')).start();
  try {
    await SSH.connect({
      host: config.host,
      username: config.username,
      password: config.password,
    });
    successLog('SSH连接成功!');
  } catch (error) {
    errorLog(error);
    console.log(error);
    errorLog('SSH连接失败!');
    process.exit(); //退出流程
  }
  loading.clear();
};

const runCommand = async command => {
  await SSH.exec(command, [], { cwd: config.path });
};

//备份、清空线上目标目录里的旧文件
const clearOldFile = async () => {
  // const date = new Date().getDate();
  // const mouth = new Date().getMonth();
  // await runCommand(`mkdir -p ${config.publicPath}`);
  // await runCommand(
  //   `cp -r ${config.publicPath} ${config.publicPath}_${mouth + 1}${date}`
  // );
  // await runCommand(`rm -rf ${config.publicPath}`);
  await runCommand(`rm -rf *`);
};

const uploadZipBySSH = async () => {
  //连接ssh
  await connectSSH();
  await clearOldFile();
  const loading = ora(defaultLog('准备上传文件')).start();
  try {
    const distZipPath = path.resolve(workPath, `./${config.publicPath}.zip`);
    await SSH.putFiles([{ local: distZipPath, remote: config.path + `/${config.publicPath}.zip` }]); //local 本地 ; remote 服务器 ;
    successLog('上传成功!');
    loading.text = '正在解压文件';
    await runCommand(`unzip ./${config.publicPath}.zip`); //解压
    await runCommand(`rm -rf ./${config.publicPath}.zip`);
    SSH.dispose(); //断开连接
  } catch (error) {
    errorLog(error);
    errorLog('上传失败!');
    process.exit(); //退出流程
  }
  loading.clear();
};

const clearZipDist = async () => {
  const distZipPath = path.resolve(workPath, `./${config.publicPath}.zip`);
  fs.unlink(distZipPath, () => {});
};

const runUploadTask = async () => {
  //打包
  await compileDist();
  //压缩
  await zipDist();

  //连接服务器上传文件
  await uploadZipBySSH();

  await clearZipDist();

  successLog('部署成功!');
  if (webHookUrl) {
    await sendMsg();
  }

  process.exit();
};
async function sendMsg() {
  try {
    await axios.post(webHookUrl, {
      msgtype: 'markdown',
      markdown: {
        title: '部署成功',
        text: '## ci上传代码已成功\n #### 最新上传环境:\n' + config.name,
      },
      at: {
        atMobiles,
        isAtAll: false,
      },
    });
  } catch (error) {
    console.log(error);
  }
}

const checkConfig = conf => {
  const checkArr = Object.entries(conf);
  checkArr.map(it => {
    const key = it[0];
    if (key === 'PATH' && conf[key] === '/') {
      //上传zip前会清空目标目录内所有文件
      errorLog('PATH 不能是服务器根目录!');
      process.exit(); //退出流程
    }
    if (!conf[key]) {
      errorLog(`配置项 ${key} 不能为空`);
      process.exit(); //退出流程
    }
  });
};

async function inputPwd() {
  const data = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: '服务器密码',
    },
  ]);
  return data.password;
}

async function initInquirer(conf) {
  const data = await inquirer.prompt([
    {
      type: 'list',
      message: '请选择发布环境',
      name: 'env',
      choices: conf.servers.map(sever => ({
        name: sever.name,
        value: sever.name,
      })),
    },
  ]);
  webHookUrl = conf.webHookUrl || '';
  atMobiles = conf.atMobiles || [];
  config = conf.servers.find(server => data.env === server.name);
  if (config) {
    if (!config.password) {
      config.password = await inputPwd();
    }
    checkConfig(config);
    runUploadTask();
  } else {
    errorLog('未找到该环境');
  }
}

const run = (conf, path) => {
  workPath = path;
  initInquirer(conf);
};
module.exports = run;
