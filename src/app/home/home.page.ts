import {Component, OnInit} from '@angular/core';
import {SqLiteService} from '../sqlite.service';


@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
    results = [];
    // isBuild = [];

    thisId;

    constructor(
        private sqLiteService: SqLiteService
    ) {

    }

    ngOnInit() {
        this.sqLiteService.queryResult.subscribe(it => this.results.push(it));
        // this.isBuild.push(this.sqLiteService.isBuild);
    }

    add(name) {
        if (name === '') return;
        this.sqLiteService.insert(name);
        this.query();

    }

    delete(id) {
        this.sqLiteService.delete(id);
        this.query();
    }

    clickName(id) {
        this.thisId = id;
    }

    upDate(name) {
        if (name === '') {
            this.thisId = '';
            return;
        }

        this.sqLiteService.update({id: this.thisId, name: name});
        this.query();
        this.thisId = '';
    }

    query() {
        this.results = [];
        this.sqLiteService.query();
    }
}
