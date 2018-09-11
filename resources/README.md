## 说明

这篇文章主要说明: 利用ionic4在手机上中完成SQLite增删改查等基本操作的过程

## 安装
#### 1.在项目中添加相关组件
在命令行中输入

    $ ionic cordova plugin add cordova-sqlite-storage
    $ npm install --save @ionic-native/sqlite
    
#### 2.在app.module.ts文件中导入
这里按照[官网](https://beta.ionicframework.com/docs/native/sqlite/)的方式导入会发现导入不成功

首先, 这里要修改一下package.json文件, 要将sqlite的版本改为
    
    "@ionic-native/sqlite": "5.0.0-beta.15"
    
重新npm install后, 在 ./src/app/app.module.ts 中添加
    
    import { SQLite  } from '@ionic-native/sqlite/ngx';

    providers: [
        StatusBar,
        SplashScreen,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        SQLite
    ],
    
## demo
注意!!! 由于SQLite是个ionic插件, 所以整个测试过程需要打包到真机上测试.

#### 1.概述 

我们这个demo的流程大概是:

(1)进入app后, 从SQLite获取数据显示到界面上.

(2)在界面上可以进行添加,修改,删除等操作, 每次操作完成之后, 再对界面进行更新

#### 2.查询功能

我们使用SQLite的查询完成获取数据的功能, 再将其渲染到界面上

(1)我们需要创建一个SQLite的service

    $ ionic g service sqlite
    
(2)我们需要在service里导入SQLite插件

sqlite.service.ts:
    
    import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
    
    constructor(private sqLite: SQLite) {            
    }
    
(3)在我们查询之前, 我们得先有一个数据库, 所以这里写一个初始化数据库的方法, 通过create方法创建数据库, 然后使用executeSql方法创建一张简单的表

sqlite.service.ts:
    
    private database: SQLiteObject;// 保存数据库对象
    
    constructor(
        private sqLite: SQLite
    ) {
        // 初始化数据库
        this.initDB();
    }
    
    private initDB() {
        // 使用SQLite的create方法创建数据库, 参数为数据库的基本配置
        this.sqLite.create({ 
              name: 'test.db',
              location: 'default'
        }).then((db: SQLiteObject) => {
              // 使用executeSql方法建表, 第一个参数是sql语句, 第二个参数这里为[], 后面会用到
              db.executeSql('create table if not exists test(id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(32))', [])
                    .then(() => console.log('crate table'))
                    .catch(e => console.log(e));
              
              // 保存数据库对象          
              this.database = db;
              
              // 执行查询
              this.query();
        }).catch(e => console.log(e));
    }

(4)现在我们就可以实现查询方法了, 这里我们将查询结果用一个变量queryResult存储下来, 以便组件使用
    
sqlite.service.ts:
    
    queryResult = new Subject<any>(); // 储存查询结果, 由于查询是异步的, 所以使用Subject类型存储
    
    query() {
        // 使用executeSql方法查询数据
        this.database.executeSql('select * from test', []).then(res => {
            // 储存查询结果
            if (res.rows.length > 0) {
                for (let i = 0; i < res.rows.length; i++) {
                    this.queryResult.next({id: res.rows.item(i).id, name: res.rows.item(i).name});
                }
            }
        }, error => console.log(error));
    }
    
(5) 现在我们就可以渲染数据了

(a)我们先导入sqlite.service.ts

home.page.ts
    
    import {SqLiteService} from '../sqlite.service';
    
    constructor(
        private sqLiteService: SqLiteService
    ) {
    }
    
(b)订阅service的查询结果

home.page.ts

    results = []; // 存储查询结果
    
    ngOnInit() {
        this.sqLiteService.queryResult.subscribe(it => this.results.push(it));
    }
    
(c)渲染数据(scss在最后面), 之后会给name部分和图标添加事件

home.page.html

    <ion-content>        
        <div *ngIf="!results.length" class="null">你还没有数据</div>
    
        <ng-container *ngFor="let row of results">
            <div class="row">
                <div class="id">{{row.id}}</div>
                <div class="name">{{row.name}}</div>
                <div class="delete"><ion-icon slot="start" name="close"></ion-icon></div>
            </div>
        </ng-container>
    </ion-content> 
    
到此为止我们就完成查询功能了, 每次进入app都会查询一次, 并将数据渲染到界面上

#### 3.插入功能

我们不光要能查询还要可以在界面进行插入数据的操作

(1)首先, 我们在service里添加一个插入方法, 和查询方法一样, 通过SQLite的executeSql方法实现

sqlite.service.ts:

    insert(name) {
        this.database.executeSql('INSERT INTO test (name) VALUES (?);', [name])
            .then(() => console.log('finish insert'))
            .catch(e => console.log(e));
    }
    
(2)然后, 我们得在界面上完成插入操作部分

home.page.html

    <ion-item>
        <ion-label position="floating">请输入需要添加的数据</ion-label>
        <ion-input type="text" maxlength="5" #data></ion-input>
        <button class="addBtn" (click)="add(data.value)">添加</button>
    </ion-item>
    
(3)我们再来完成add方法

home.page.ts

    add(name) {
        if (name === '') return;
        // 调用service的insert完成插入
        this.sqLiteService.insert(name);
    }
    
(4)插入之后, 我们还需要刷新一下界面

home.page.ts

    add(name) {
        if (name === '') return;
        // 调用service的insert完成插入
        this.sqLiteService.insert(name);
        // 重新查询一次, 完成刷新
        this.query();
    }
    
    query() {
        // 这里不清空的话, 会将上次的查询结果渲染出来
        this.results = [];
        this.sqLiteService.query();
    }
    
#### 4.删除功能

删除功能和插入功能的实现原理差不多

(1)在service实现删除方法

sqlite.service.ts:

    delete(id) {
        this.database.executeSql('DELETE FROM test WHERE id=?;', [id])
            .then(() => console.log('删除成功'))
            .catch(e => console.log(e));
    }
    
(2)然后, 我们得在界面上完成删除操作部分, 给我们之前的图标绑定删除事件

home.page.html

    <div class="delete" (click)="delete(row.id)"><ion-icon slot="start" name="close"></ion-icon></div>
    
(3)实现delete方法, 然后更新界面

home.page.ts

    delete(id) {
        this.sqLiteService.delete(id);
        this.query();
    }
    
#### 5.修改功能

修改功能, 原理同上

(1)在service实现修改方法

sqlite.service.ts:

    update(params) {
        this.database.executeSql('UPDATE test set name=? WHERE id=?;', [params.name, params.id])
            .then(() => console.log('修改成功'))
            .catch(e => console.log(e));
    }
    
(2)然后, 我们得在界面上完成修改操作部分, 给我们之前的name绑定事件显示alert框, 我们在alert框中完成修改操作

home.page.html

    <div class="name" (click)="clickName(row.id)">{{row.name}}</div>
    
    <div *ngIf="thisId" class="alert">
        <ion-item lines="full">
            <ion-label position="floating">请输入你的新名字</ion-label>
            <ion-input type="text" maxlength="5" #newData></ion-input>
            <button class="updateBtn" (click)="upDate(newData.value)">确定修改</button>
        </ion-item>
    </div>
    
(3)实现clickName和upDate方法, 然后更新界面

home.page.ts

    thisId; // 传递id值, 并控制alert框的显示隐藏
    
    clickName(id) {
        this.thisId = id;
    }
    
    upDate(name) {
        if (name === '') {
            his.thisId = '';
            return;
        }
    
        this.sqLiteService.update({id: this.thisId, name: name});
        this.query();
        this.thisId = '';
    }

#### 6.scss代码

    $height: 50px;
    
    .null {
        margin: 1em;
    }
    
    .row {
        display: flex;
        width: 250px;
        height: $height;
        border-radius: 10px;
        overflow: hidden;
        font-size: 20px;
        margin: 0.5em;
    
        .id {
            width: 50px;
            height: 100%;
            line-height: $height;
            background-color: #5F7D8C;
            text-align: center;
            color: white;
        }
    
    
        .name {
            flex-grow: 1;
            height: 100%;
            line-height: $height;
            background-color: #EEE;
            text-align: center;
        }
    
        .delete {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 50px;
            height: 100%;
    
            background-color: #5F7D8C;
            color: white;
            font-size:30px;
        }
    }
    
    ion-item {
        position: relative;
    
        .addBtn {
            position: absolute;
            right: 30px;
            bottom: 6px;
            width: 50px;
            height: 30px;
            background-color: #3f79e0;
            border-radius: 10px;
            color: white;
            outline: 0;
        }
    }
    
    .alert {
        position: fixed;
        top: 50px;
        left: 10%;
        background-color: whitesmoke;
        width: 80%;
    }
    
    .updateBtn {
        margin: 10px auto;
        height: 30px;
        width: 100px;
        background-color: #3f79e0;
        color: white;
        border-radius: 5px;
    }


至此, 我们就完成了SQLite的基本操作了

    