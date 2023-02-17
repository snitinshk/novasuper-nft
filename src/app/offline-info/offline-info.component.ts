import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { GoogleAnalyticsService } from "../google-analytics.service";
import { RouteNames } from "../app-routing.module";
import { Router } from "@angular/router";

@Component({
  selector: "app-offline-info",
  templateUrl: "./offline-info.component.html",
  styleUrls: ["./offline-info.component.scss"],
})
export class OfflineInfoComponent implements OnInit {
  RouteNames = RouteNames;
  constructor(
    public globalVars: GlobalVarsService,
    private analyticsService: GoogleAnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  login() {
    this.router.navigate(["/" + this.RouteNames.SIGNUP]);
  }
  signUp() {
    this.router.navigate(["/" + this.RouteNames.SIGNUP]);
  }
}
