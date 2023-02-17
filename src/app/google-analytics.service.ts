import { Injectable } from "@angular/core";
declare let gtag: Function;

@Injectable({
  providedIn: "root",
})
export class GoogleAnalyticsService {
  static eventEmitter(arg0: string, arg1: string, arg2: string, arg3: string, arg4: number) {
    throw new Error("Method not implemented.");
  }
  constructor() {}

  public eventEmitter(
    eventName: string,
    eventCategory: string,
    eventAction: string,
    eventLabel: string = null,
    eventValue: number = null
  ) {
    gtag("event", eventName, {
      eventCategory: eventCategory,
      eventLabel: eventLabel,
      eventAction: eventAction,
      eventValue: eventValue,
    });
  }
}
