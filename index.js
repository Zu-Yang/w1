#!/usr/bin/env node

var co = require("co");
var prompt = require("co-prompt");
var program = require("commander");
var request = require("request");
var http = require("http");
var https = require("https");
var fs = require("fs");
var url = require("url");
var qs = require("querystring");
const os = require("os");
const path = require("path");
const JSZip = require("jszip");
const moment = require("moment");
const Countdown = require("./countdown.js");
const mailer = require("./mailer.js");

// 取消上传
process.on("SIGINT", function () {
  deleteaFile();
  console.log("\x1B[31m%s\x1B[0m", "\n你已终止操作");
  process.exit(); // 立即终止node.js应用程序
});

// 全局捕获错误
process.on("uncaughtException", (error) => {
  // 打印错误信息
  console.error("\x1B[31m%s\x1B[0m", error);
  // 执行必要的清理操作
  deleteaFile(); // 清理文件
  // 在完成清理后，可以选择退出进程
  process.exit();
});

let pcUrl = os.homedir(); // 获取操作系统中用户的主目录URL
let files = fs.readdirSync(pcUrl); // 从指定路径（pcUrl）中读取目录中的所有文件
let record = false; // 是否存在.w1文件夹
let newP = path.join(os.homedir(), ".w1"); // 将主目录和.w1文件夹的路径连接, 可以用于创建、操作或删除.w1文件夹
let zipIs = false;
let filesUrl = [];
files.forEach(function (itm, index) {
  if (itm == ".w1") {
    record = true;
  }
});

var CONFIG = {
  site: "",
  // test
  username: "",
  password: "",
  recordList: "http://cms." + this.site + ".com.cn/" + this.site + "/Enq",
};

// JSESSIONID->login->upload
//doc: https://www.npmjs.com/package/commander#coercion
program
  .arguments("<file...>")
  .option("-u, --username <username>", "PC账户名")
  .option("-p, --password <password>", "PC账户密码")
  .option("-s, --site <site>", "pconline/pcauto/pcbaby/pclady/pchouse")
  .option("-t, --targetPath <targetPath>", "路径(注意避免覆盖他人项目)")
  .option("-m, --timer <timer>", "定时上传文件")
  .command("reset", "重置用户信息")
  .action(function (file) {
    file = Array.from(new Set(file));
    let fileLx = [];
    try {
      file.forEach(function (item, index) {
        if (item[0] == ".") {
          // console.log(
          //   "\x1B[31m%s\x1B[0m",
          //   "文件或者文件夹不能以.开头：" + item
          // );
          throw Error("文件或者文件夹不能以.开头：" + item);
        } else {
          if (!fs.existsSync(item)) {
            // console.log(
            //   "\x1B[31m%s\x1B[0m",
            //   "file " + item + " dosn't exists!"
            // );
            throw Error("file " + item + " dosn't exists!");
          }
          let statsObj = fs.statSync(item);
          if (item.indexOf(".") == -1) {
            if (!statsObj.isDirectory()) {
              // console.log("\x1B[31m%s\x1B[0m", "文件类型有误：" + item);
              throw Error("文件类型有误：" + item);
            }
          }
          if (statsObj.isDirectory()) {
            fileLx.push(" 文件夹 ");
            fileEvent(item, index);
          }
          if (statsObj.isFile()) {
            fileLx.push(" 文件 ");
          }
          if (item.indexOf(".zip") != -1) {
            zipIs = true;
          }
        }
      });
    } catch (e) {
      throw Error(e);
    }
    console.log("\n需要上传的类型：" + Array.from(new Set(fileLx)) + "\n");

    // function* () {} 生成器函数；yield 暂停函数；next 继续执行函数, 配合co使用
    co(function* () {
      // site处理
      var site = yield prompt("\x1B[36m site: \x1B[0m");
      switch (site) {
        case "pconline":
        case "pcauto":
        case "pclady":
        case "pcbaby":
        case "pchouse":
          CONFIG.site = site;
          break;
        default:
          throw Error("Illegal site!");
      }
      // targetPath处理
      var targetPath = yield prompt("\x1B[36m targetPath: \x1B[0m");
      if (!targetPath) {
        throw Error("Illegal path!");
      }
      // timer处理
      var timer = yield prompt("\x1B[36m timer(YYYY-MM-DD HH:mm:ss): \x1B[0m");
      if (!timer) {
        throw Error("Illegal timer!");
      }

      var username = "";
      var password = "";
      var email = "";
      var userInfoIs = false;
      if (record) {
        //读取文件
        var data = getUserInfo();
        if (data) {
          data = eval("(" + data + ")");
          username = data.username;
          password = data.password;
          email = data.email;
        } else {
          username = yield prompt("\x1B[36m username: \x1B[0m");
          password = yield prompt("\x1B[36m password: \x1B[0m");
          email = yield prompt("\x1B[36m email: \x1B[0m");
          userInfoIs = true;
        }
      } else {
        username = yield prompt("\x1B[36m username: \x1B[0m");
        password = yield prompt("\x1B[36m password: \x1B[0m");
        email = yield prompt("\x1B[36m email: \x1B[0m");
      }
      process.stdin.pause();

      var postContent = qs.stringify({
        app: CONFIG.site == "pcbaby" ? "pckidsulms" : "upload_" + CONFIG.site,
        return:
          "http://cms-upload." +
          CONFIG.site +
          ".com.cn:8080/" +
          CONFIG.site +
          "/Security?dispatch =login",
        // "return": 'http://cms.pconline.com.cn:8080/pconline/login.jsp',
        username: username,
        password: password,
      });

      var headers = {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "http://cms-upload." + CONFIG.site + ".com.cn",
        Referer:
          "http://cms-upload." +
          CONFIG.site +
          ".com.cn/" +
          CONFIG.site +
          "/Security?dispatch=login",
        // 'Referer':'http://cms.pconline.com.cn:8080/pconline/login.jsp',
        "Upgrade-Insecure-Requests": "1",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36",
        "Content-Length": postContent.length,
      };

      var options = {
        hostname: "auth.pconline.com.cn",
        port: 443,
        path: "/security-server/auth.do",
        method: "POST",
        headers: headers,
        rejectUnauthorized: false,
        requestCert: true,
      };

      // options.headers.cookie = session;
      var promise = new Promise(function (resolve, reject) {
        var req = https
          .request(options, function (res) {
            var _url = url.parse(res.headers.location);
            var tmp = url.parse(_url).query;
            var _res = qs.parse(tmp);
            if (_res.st == -1) {
              // console.log(
              //   "\x1B[31m%s\x1B[0m",
              //   "\n用户信息验证失败！请确认您的用户信息是否更新过，稍后重试！"
              // );
              deleteall(newP); // 删除w1文件
              // 路径处理
              targetPath = targetPath[0] == "/" ? targetPath : "/" + targetPath;
              targetPath =
                targetPath[targetPath.length - 1] == "/"
                  ? targetPath
                  : targetPath + "/";
              if (!!email)
                mailer(
                  "上传失败，用户信息验证失败！",
                  email,
                  `https://www1.${site}.com.cn${targetPath}`
                ).then(function (res) {
                  console.log("已发送邮箱提醒");
                });
              throw Error(
                "用户信息验证失败！请确认您的用户信息是否更新过，稍后重试！"
              );
            } else {
              let formUrl = res.headers.location.replace(":8080", "");
              request(formUrl, function (error, response, body) {
                session = response.headers["set-cookie"][0].split(";")[0];
                // console.log(session)
                resolve && resolve(session);
              });
            }
          })
          .on("error", function (err) {
            throw Error(err);
          });
        req.write(postContent);
        req.end();
      });

      // 打包上传
      function packUpload() {
        console.log("\n");
        return promise
          .then(function (session) {
            return new Promise(function (resolve, reject) {
              if (filesUrl.length != 0) {
                console.log("请耐心等待，正在打包相关文件夹...");
                let time = setInterval(() => {
                  let finish = false;
                  for (let i = 0; i < filesUrl.length; i++) {
                    if (!fs.existsSync(filesUrl[i].path)) {
                      finish = true;
                      break;
                    }
                  }
                  if (!finish) {
                    clearInterval(time);
                    console.log("相关文件夹打包完成,正在上传...");
                    resolve && resolve(session);
                  }
                }, 500);
              } else {
                resolve && resolve(session);
              }
            });
          })
          .then(function (session) {
            targetPath = targetPath[0] == "/" ? targetPath : "/" + targetPath;
            targetPath =
              targetPath[targetPath.length - 1] == "/"
                ? targetPath
                : targetPath + "/";

            // {zip,jpg,png,gif,js,css,html,mp3,mp4}
            var _files = [];
            var setFileObj = function (file) {
              var _file = file.split("/");
              _file = _file[_file.length - 1];
              // console.log(_file)
              return {
                value: fs.createReadStream(file),
                options: {
                  filename: _file,
                },
              };
            };
            if (filesUrl.length != 0) {
              filesUrl.forEach((item, index) => {
                zipIs = true;
                file[item.num] = item.path;
              });
            }
            file.forEach(function (item, index) {
              _files.push(setFileObj(item));
            });
            // console.log(_files);
            //from request payload
            var formData = {
              dispatch: "upload",
              colId: "/",
              ulUser: username, //back end record
              siteId: "2",
              colIdNormal: "/",
              toDir: targetPath,
              ulfile: _files,
            };
            return new Promise(function (resolve, reject) {
              // docs: https://www.npmjs.com/package/request#multipartform-data-multipart-form-uploads
              request.post(
                {
                  // target server ==  nginx || resin
                  url:
                    "http://cms-upload." +
                    CONFIG.site +
                    ".com.cn/" +
                    CONFIG.site +
                    "/Upload",
                  // headers:pconlineHeaders,
                  headers: {
                    Accept:
                      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    cookie: session, // session from request.post is invalid when site is pconline
                    "Content-Type": "multipart/form-data",
                    // 'Referer': 'http://cms-upload.' + CONFIG.site + '.com.cn:8080/' + CONFIG.site + '/fileUpload.jsp',
                  },
                  formData: formData,
                },
                function (err, res, body) {
                  resolve(body);
                }
              );
            });
          })
          .then(function (body) {
            var reg = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g;
            var _arr = body.match(reg);
            var zipOne = false;

            _arr.forEach(function (item) {
              var s = item.match(/>(.*)</);
              if (s[1] == "here") {
                // console.log(`\n\x1B[37m\x1B[46m上传成功：\x1B[0m \x1B[36m 根Url为：https://www1.${site}.com.cn${targetPath}\x1B[0m`)
                if (!zipOne) {
                  zipOne = true;
                  if (zipIs) {
                    console.log(
                      "\x1B[36m%s\x1B[0m",
                      `上传成功：根Url为：https://www1.${site}.com.cn${targetPath}`
                    );
                  } else {
                    file.forEach(function (item) {
                      console.log(
                        "\x1B[36m%s\x1B[0m",
                        `上传成功：Url为：https://www1.${site}.com.cn${targetPath}${item}`
                      );
                    });
                  }
                }
              } else {
                // console.log('\n\x1B[37m\x1B[46m上传成功：\x1B[0m \x1B[36m 根Url为：'+s[1]+'\x1B[0m');
                console.log("\x1B[36m%s\x1B[0m", "上传成功：Url为：" + s[1]);
              }
            });
            deleteaFile(); // 删除文件
            if (userInfoIs && record) {
              saveUserInfo(username, password, email, true);
            } else {
              if (!record) {
                saveUserInfo(username, password, email);
              }
            }
            if (zipIs == true)
              return new Promise(function (resolve, reject) {
                // 压缩包
                resolve && resolve(`https://www1.${site}.com.cn${targetPath}`);
              });
          })
          .catch(function (err) {
            // console.log("\x1B[31m%s\x1B[0m", err);
            throw Error(err);
          });
      }
      // 信息展示
      console.log(
        "file: %s  site: %s  targetPath: %s 上传时间: %s",
        file,
        site,
        targetPath,
        timer
      );
      // 倒计时
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timer)) {
        const start = new Date().getTime();
        const end = moment(timer, "YYYY-MM-DD HH:mm:ss").valueOf();
        if (end < start) {
          console.log("\x1B[31m%s\x1B[0m", "上传时间不能小于当前时间！");
          return;
        }

        // 验证用户信息
        promise
          .then(function (res) {
            // console.log(res, "信息验证通过！");
            console.log(`\n`);
            // 创建倒计时
            new Countdown(
              start, // 开始时间的时间戳
              end, // 结束的时间戳
              // 倒计时中回调
              function (param) {
                const { days, hours, minutes, seconds } = param;
                var remainder =
                  (days == "00" ? "" : days + "天") +
                  (hours == "00" ? "" : hours + "时") +
                  (minutes == "00" ? "" : minutes + "分") +
                  seconds +
                  "秒";
                process.stdout.moveCursor(0, -1); // x 的值为 0，表示光标的列保持不变。y 的值为 -1，表示光标向上移动一行
                process.stdout.clearLine(); // 清除当前行
                console.log(
                  `\x1B[36m${remainder}\x1B[0m后开始上传，请勿关闭终端！`
                ); // 光标会自动换行
              },

              // 结束回调
              function () {
                packUpload().then(function (url) {
                  if (url && !!email)
                    mailer("上传成功", email, url).then(function (res) {
                      console.log("已发送邮箱提醒");
                    });
                }); // 倒计时结束自动执行上传
              }
            );
          })
          .catch(function (err) {
            throw Error(err);
          });
      } else if (timer == "none") {
        packUpload();
      } else {
        // console.log("\x1B[31m%s\x1B[0m","非定时上传请输入：none，定时上传请输入：具体时间（格式为YYYY-MM-DD HH:mm:ss）");
        throw Error(
          "非定时上传输入：none，定时上传输入：具体时间（格式YYYY-MM-DD HH:mm:ss）"
        );
      }
    });
  })
  .on("command:reset", function () {
    try {
      deleteall(newP);
      console.log("\x1B[36m%s\x1B[0m", "重置成功！");
    } catch (err) {
      console.log("\x1B[31m%s\x1B[0m", err);
      console.log("\x1B[31m%s\x1B[0m", "重置失败！");
    }
  })
  .parse(process.argv);

// 保存用户信息在操作系统中用户的主目录
function saveUserInfo(username, password, email, info = false) {
  let fpath = path.join(newP, "w1");
  if (info) {
    deleteall(newP);
  }
  fs.mkdirSync(newP);
  fs.writeFile(
    fpath,
    `{username:'${username}',password:'${password}',email:'${email}'}`,
    function (err) {
      if (err) {
        // console.log("\x1B[31m%s\x1B[0m", err);
        throw Error(err);
      }
    }
  );
}
// 获取操作系统中用户的主目录.w1文件的用户信息
function getUserInfo() {
  let fpath = path.join(newP, "w1");
  let data = null;
  try {
    data = fs.readFileSync(fpath, "utf-8");
    return data;
  } catch (err) {
    // console.log("\x1B[31m%s\x1B[0m", "读取文件失败,内容是" + err.message);
    throw Error("读取文件失败,内容是" + err.message);
  }
}
// 删除操作系统中用户的主目录.w1文件
function deleteall(path) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function (file, index) {
      // console.log(file);
      let curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        deleteall(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
// 打包时间
function getTime() {
  let date = new Date(),
    m = date.getMonth() + 1,
    d = date.getDate(),
    h = date.getHours(),
    mn = date.getMinutes();

  let M = m < 10 ? "0" + m : "" + m;
  let D = d < 10 ? "0" + d : "" + d;
  let _h = h < 10 ? "0" + h : "" + h;
  let _m = mn < 10 ? "0" + mn : "" + mn;

  return M + D + _h + _m;
}
// 读取目录
function readDir(zip, distUrl) {
  let files = fs.readdirSync(distUrl);
  let self = arguments.callee;
  files.forEach(function (fileName, index) {
    if (fileName.indexOf(".") !== 0) {
      let filePath = distUrl + fileName;
      let file = fs.statSync(filePath);
      // console.log('已添加: '+filePath)
      if (file.isDirectory()) {
        self(zip.folder(fileName), filePath + "/");
      } else {
        zip.file(fileName, fs.readFileSync(filePath));
      }
    }
  });
}
// 打包
function pack(fileName, filePath) {
  // console.log('\n打包中\n');
  let projectUrl = process.cwd() + "/" + filePath + "/";
  let fileUrl = projectUrl + `${fileName}.zip`;
  let zip = new JSZip();
  readDir(zip, projectUrl);
  return zip
    .generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    })
    .then(function (content) {
      fs.writeFileSync(fileUrl, content, "utf-8");
    });
}

// 文件处理
function fileEvent(item, index) {
  let fileName = getTime();
  let co = {
    path: item + "/" + `${fileName}.zip`,
    num: index,
  };
  filesUrl.push(co);
  pack(fileName, item).then(() => {
    // console.log('打包成功');
  });
}

// 删除打包文件
function deleteaFile() {
  if (!!filesUrl) {
    filesUrl.forEach((item) => {
      fs.unlink(item.path, (err) => {});
    });
  }
}
