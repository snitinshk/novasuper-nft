import { Component, HostListener, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "app-page-two",
  templateUrl: "./page-two.component.html",
  styleUrls: ["./page-two.component.scss"],
})
export class PageTwoComponent implements OnInit {
  @Input() hideSidebar: string;
  @Input() showPostButton = false;
  mobile = false;

  @HostListener("window:resize") onResize() {
    this.setMobileBasedOnViewport();
  }

  constructor(private globalVars: GlobalVarsService) {}

  ngOnInit() {
    this.setMobileBasedOnViewport();
  }

  setMobileBasedOnViewport() {
    this.mobile = this.globalVars.isMobile();
  }
}