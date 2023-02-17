import { Component, Input, OnInit } from "@angular/core";
import { AppRoutingModule } from "../app-routing.module";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "app-small-left-bar",
  templateUrl: "./small-left-bar.component.html",
  styleUrls: ["./small-left-bar.component.scss"],
})
export class SmallLeftBarComponent implements OnInit {
  @Input() hasNotifications = false;
  AppRoutingModule = AppRoutingModule;

  constructor(public globalVars: GlobalVarsService) {}

  ngOnInit(): void {}

}
