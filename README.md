# 自动部署前端页面脚本

## 使用方式

### 安装包

```
npm i deploy-auto -D
```
### 项目根路径配置一个运行文件
`/deploy.js`

```js
const run = require("deploy-auto");
const CONFIG = {
  robotTitle:'title', // 钉钉提示机器人标题
	robotDesc:'ci上传代码成功提示\n', // 钉钉提示机器人发的消息
	webHookUrl:
		'https://oapi.dingtalk.com/robot/send?access_token=XXXXX', // 钉钉机器人地址具体参考钉钉文档
	atMobiles: [18668038687], // 机器人艾特的人 
  servers: [
    {
      publicPath: "dist", // 项目打包之后的文件夹名称，一般都是dist文件夹，如果你的项目打包成别的文件夹名称，填写打包之后文件夹名称即可
      name: "测试环境", // 部署环境的名称
      username: "water", // 部署服务器的账号
      password: "123456", // 部署服务器的密码，如果重要，可以不写在当前配置文件中
      path: "/usr/html/water/", //前端代码在服务器下的路径
      host: "127.0.0.1", //服务器ip
      port: "22", //端口
      script: "build", //打包命令
    },
    {
      publicPath: "dist", // 项目打包之后的文件夹名称，一般都是dist文件夹，如果你的项目打包成别的文件夹名称，填写打包之后文件夹名称即可
      name: "预发环境", // 部署环境的名称
      username: "water", // 部署服务器的账号
      password: "", // 部署服务器的密码，如果重要，可以不写在当前配置文件中
      path: "/usr/html/water/", //前端代码在服务器下的路径
      host: "127.0.0.11", //服务器ip
      port: "22", //端口
      script: "build", //打包命令
    },
  ],
};
run(CONFIG, __dirname);
```

### 项目`package.json`中脚本命令配置

```json
{
    "scripts": {
    "deploy": "node ./deploy.js"
  },
}
```

### 执行发布

```bash
npm run deploy
```

### 结果

```bash
? 请选择发布环境 (Use arrow keys)
❯ 测试环境 
  预发环境
```
选择需要的发布的环境就好了




