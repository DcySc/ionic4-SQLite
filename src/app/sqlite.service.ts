import {Injectable} from '@angular/core';
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {Subject} from 'rxjs/internal/Subject';


@Injectable({
    providedIn: 'root'
})
export class SqLiteService {

    private database: SQLiteObject;

    queryResult = new Subject<any>();

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
            // 使用executeSql方法建表, 第一个参数是sql语句, 第二个参数这里为{}, 后面会用到
            db.executeSql('create table if not exists test(id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(32))', [])
                .then(() => console.log('crate table'))
                .catch(e => console.log(e));

            // 保存数据库对象
            this.database = db;

            // 执行查询
            this.query();
        }).catch(e => console.log(e));
    }

    insert(name) {
        this.database.executeSql('INSERT INTO test (name) VALUES (?);', [name])
            .then(() => console.log('finish insert'))
            .catch(e => console.log(e));
    }

    update(params) {
        this.database.executeSql('UPDATE test set name=? WHERE id=?;', [params.name, params.id])
            .then(() => console.log('修改成功'))
            .catch(e => console.log(e));
    }

    delete(id) {
        this.database.executeSql('DELETE FROM test WHERE id=?;', [id])
            .then(() => console.log('删除成功'))
            .catch(e => console.log(e));
    }

    query() {
        this.database.executeSql('select * from test', []).then(res => {

            if (res.rows.length > 0) {
                for (let i = 0; i < res.rows.length; i++) {
                    this.queryResult.next({id: res.rows.item(i).id, name: res.rows.item(i).name});
                }
            }
        }, error => console.log(error));
    }
}
