# w1

www1-server-uploader

>在原 [www1](https://www.npmjs.com/package/www1) 基础上增加定时上传功能


version:1.0.0

## 安装说明

执行命令：`npm install -g www1-server-uploader`

## 命令参数说明

```
w1 <filename>
```

上传到 www1 的文件名称（支持 zip,jpg,png,gif,js,css,html,mp3,mp4）或者文件夹名称
提交成功时，系统会记住当前 `username` 和 `password`

```
w1 reset
```

重置 `username` 和 `password`

```
w1 -h 或者 w1
```

查看命令行信息

## 使用说明(图片参考:[www1](https://www.npmjs.com/package/www1))

### 首次提交：

![](https://www1.pcauto.com.cn/test/gz20210701/npm/www1/1.png)

| 参数         | 说明                                                    |
| ------------ | ------------------------------------------------------- |
| `site`       | 需要上传到那个网(pconline/pcauto/pcbaby/pclady/pchouse) |
| `targetPath` | 需要上传的路径(注意避免覆盖他人项目)                    |
| `timer`      | 上传时间(YYYY-MM-DD HH:mm:ss)                           |
| `username`   | PC 账户名                                               |
| `password`   | PC 账户密码                                             |

### 再次提交

![](https://www1.pcauto.com.cn/test/gz20210701/npm/www1/2.jpg)

> 使用过一次 w1 上传成功后，系统会自动记录 username 和 password

### 重置`username`与`password`

![](https://www1.pcauto.com.cn/test/gz20210701/npm/www1/3.png)

> 重置完，下次提交时，需要重新输入`username`和`password`

### 单个上传模式(推荐使用此模式)

- 单文件

![](https://www1.pcauto.com.cn/test/gz20210701/npm/www1/2.jpg)

- 单文件夹

![](https://www1.pcauto.com.cn/test/gz20210701/npm/www1/4.png)

### 多个上传模式

- 多个文件

![](https://www1.pcauto.com.cn/test/gz20210701/npm/www1/5.png)

- 多个文件夹

![](https://www1.pcauto.com.cn/test/gz20210701/npm/www1/6.png)

- 混合

![](https://www1.pcauto.com.cn/test/gz20210701/npm/www1/7.png)

### 注意

```
上传的文件夹或者文件必须符合 w1 上传规范 ，否则上传会失败
```
