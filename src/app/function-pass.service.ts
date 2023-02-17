import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class FunctionPassService {
  private _listener = new Subject<any>();
  constructor() {}

  listen(): Observable<any> {
    return this._listener.asObservable();
  }

  filter(filterBy: string) {
    this._listener.next(filterBy);
  }
}
