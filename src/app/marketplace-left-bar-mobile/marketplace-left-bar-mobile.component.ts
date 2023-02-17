import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { trigger, state, style, animate, transition } from "@angular/animations";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "app-marketplace-left-bar-mobile",
  templateUrl: "./marketplace-left-bar-mobile.component.html",
  styleUrls: ["./marketplace-left-bar-mobile.component.scss"],
  animations: [
    trigger("leftBarAnimation", [
      transition(":enter", [
        style({ transform: "translateY(100%)" }),
        animate("300ms cubic-bezier(0.175, 0.885, 0.32, 1.175)", style({ transform: "translateY(0%)" })),
      ]),
      transition(":leave", [
        style({ transform: "translateY(0%)" }),
        animate("300ms ease", style({ transform: "translateY(100%)" })),
      ]),
    ]),
    trigger("translucentBackgroundAnimation", [
      transition(":leave", [
        style({ "background-color": "rgba(0, 0, 0, 0.35)" }),
        animate("0.3s ease-out", style({ "background-color": "rgba(0, 0, 0, 0)" })),
      ]),
    ]),
  ],
})
export class MarketplaceLeftBarMobileComponent {
  @Input() inTutorial: boolean = false;

  constructor(public globalVars: GlobalVarsService) {}

  _closeMenu() {
    this.globalVars.isMarketplaceLeftBarMobileOpen = false;
  }
}
