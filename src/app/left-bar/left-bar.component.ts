import { Component, EventEmitter, HostBinding, Input, Output } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { AppRoutingModule, RouteNames } from "../app-routing.module";
import { MessagesInboxComponent } from "../messages-page/messages-inbox/messages-inbox.component";
import { IdentityService } from "../identity.service";
import { BackendApiService, TutorialStatus } from "../backend-api.service";
import { Router } from "@angular/router";
import { SwalHelper } from "../../lib/helpers/swal-helper";
import { environment } from "src/environments/environment";

@Component({
  selector: "left-bar",
  templateUrl: "./left-bar.component.html",
  styleUrls: ["./left-bar.component.scss"],
})
export class LeftBarComponent {
  MessagesInboxComponent = MessagesInboxComponent;
  environment = environment;

  applycreator = true;

  @HostBinding("class") get classes() {
    return !this.isMobile ? "global__nav__flex" : "";
  }

  @Input() isMobile = false;
  @Input() inTutorial: boolean = false;
  @Output() closeMobile = new EventEmitter<boolean>();
  currentRoute: string;

  AppRoutingModule = AppRoutingModule;

  constructor(
    public globalVars: GlobalVarsService,
    private identityService: IdentityService,
    private backendApi: BackendApiService,
    private router: Router
  ) {}

  // send logged out users to the landing page
  // send logged in users to browse

  getHelpMailToAttr(): string {
    const loggedInUser = this.globalVars.loggedInUser;
    const pubKey = loggedInUser?.PublicKeyBase58Check;
    const btcAddress = this.identityService.identityServiceUsers[pubKey]?.btcDepositAddress;
    const bodyContent = encodeURIComponent(
      `The below information helps support address your case.\nMy public key: ${pubKey} \nMy BTC Address: ${btcAddress}`
    );
    const body = loggedInUser ? `?body=${bodyContent}` : "";
    return `mailto:${environment.supportEmail}${body}`;
  }

  logHelp(): void {
    this.globalVars.logEvent("help : click");
  }

  hidecreator() {
    this.applycreator = false;
  }
}
