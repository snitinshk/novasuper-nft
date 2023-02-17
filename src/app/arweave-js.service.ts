import { Injectable } from "@angular/core";
import { GlobalVarsService } from "./global-vars.service";
import { Observable, of, from, throwError } from "rxjs";
import Arweave from "arweave";

@Injectable({
  providedIn: "root",
})
export class ArweaveJsService {
  private client = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
    timeout: 20000,
    logging: true,
  });

  public isUploading: boolean = false;

  // Testnet
  //private publicKey = "MlV6DeOtRmakDOf6vgOBlif795tcWimgyPsYYNQ8q1Y"
  //private arKey = {"kty":"RSA","e":"AQAB","n":"zhTx5Kr9VNQrXGarf0EXySfbSePBbIQuSOpb07s3pM3q8HKCx-bbd_py8t-JxgwnKAmpGKt6UhOP0FeobGITCwr_O7ATFPrFgTbM-xLYG0JOzxUlPScyqdJ8rFRcSSpevfUyJ6UVTpA3LDQHEzf7kebjfMPeYwpsWuT3c9LP3j0kyPDOBini-LRUpKX3n4ljhJIHzl-Jdv6Z31U65kZRBR1LPwnjcBUg4hoc50i8JZsSLsrUYFfpYVuxM0L4ch0l2-FvPtmZs831mOQgT8e1s7GPB7kJBhrQBagGF3eVnAiImJjslXNQhy4eQr6Nffb5Wa61Tec52LX5-gmoNSuA0PW5yuYGuDO2faULW74u8ZfmMUxd2x3E3M6E0deP_rj27FUQCECdbO6ATVanA16wnW7MrySu2m-Kt83XyATdVoNDls-coxA4UxuX7Rmlr2eGM7ZRKtypt12GziKnZgNglK5c_4mmMP2xeeLU1fneBLkvuHSEnoFjqZnAaI0ei6pW8Jy3k8txI5MucaRkXdPOhCm3Nwj8B9rBAh0hU64NVVb7C28Gz8LCwZkRhtGRY_v2vzcS0DaomK2G63vyQMKx3VUc9_RnkxcI6bwy6xG2GBEjpV8tHxXgw8zGc53_8EMo-9EM1PpjOHHYyaYoubDbxHaSJPwCPqi_OlGbl2h8gIM","d":"VTCEVB45Dd2NNSu9_iNW5VEkDdXoKec0SPEUV6DfXjG_SnlTxbYRiHXQGcU9a1CvyRXBQJD2RkKO4zWxSmh6bci0fKSLJtOJXKJeNvXxvsb41BLuK2ruPxRjdEuFQLuSoZzgCFJuTeVA4XV6bT_pr0UOSg-f-TogU6yt_EOrqTeGYshkqlibWmsVSGDRTbJaIL3LG00UAsw5qIBPkkyEBoS3C86XJcieKMlZpGRFXphNemlfRJpiv9vLEyE-mdGhylTVC1qhdpoPyg2Xq9MnMiqWsT8U02C3GHd-WSoWfwNqEAa7WgZqxg7S9I1X6Tf0mNWnXhZVK9gCB5IBZkVfAIR727N9eFu8QQfBUld3QNtT-JwIjXWvEsk6mc7vx3puiZiT75Adc40gV0-ynAjy2Pb1O51g9mqD19mqvwxUWeW0YBKO03dYUfw9P7lxNUaYZGoc7rUec94xznOZKxgyKXwGGPe1tROMVBZf3Ewv0yrsB6YmDXQVv1p9MHiJ6pd4iXfeyvZjzCAqwUUukMKC6C38KlVLhS_PvX1V4ebDmmfbhlQTwLyJIcL1fxrHDyOVA8ued-TI4ioXO1OXaPwjM6rwhvRYcah6UKRxnF23iJjDZ7sBedrowSYPAjDyeoU4go3MaJIcuuKl3wIrvBe-K8TczkrG4AFx7BktkRA80Lk","p":"6lC25S1c8MQWSbw1a932A2MqjPMkB79H8VQ1eYxTCI7ihMGkubOwr-ZZTcGE_-S0O5GmHPklsAmdWqnNSEotuiCCLX-cvZwbiTi0EfD4P6A9BU8n2ElIuBwWxLZKoqM977Q-2qIUFnvpfPit8Shqu3x-OykEYHDnbSLbOphcbAI1-kGsBui-wmezbvXv-ULwLi3FKey_FJfP7nYf2RazNXk1b7lqe8l3UbotsC86FudHmJe6c7O0epcuUbADeu5cpKPTzf0CMJVsW152KWOc--tXTfA03gANl30qUGYnNm40qYntGxhpUtfUZYGTg9nHKKS-gteCobMVIxHNZk8q6Q","q":"4SdWJW-MMFlrUhVLYmOTgzFNpZ9-xQ3GQ0-uJpjfqfFcwVaEyeLMQE2lDknCd58RwRpYHJBjKWIO8yhNkeIVcmSl1Fyg91g61gOBtXQoz6JQm5K9y2snGlj4BC4nQdP39dCdg7xjiRMa9nwEFnxL8hNN27xDq2n81F3VsFqG3VmXY5YMnALUjkNCVOZM_0h8L2RrOCLroKu_NI6WV1LIaAKe7y99ZiOsQl5MMjwp12n4ea_U7l_Oyp2NlEsp5idbYa1TrC8LOWOn80jgM_iE3DrxAB5JKuI8vx_A7Jrral-aLT4oTtJDKV9B5Y7PPuhDYZrqHOkI0fwUrDIRRzYUiw","dp":"CnUxxIbCyCgoSoAw7jCI41vQsVvEtufNoTK99D_UEOS3rW8rF_KyJxej0rmZYwZlGOeGP3LLQNEdCcfcVqag5da_mKJCb6ABBp3WQ5q6qbRQJOWEhL24licCySLNr_aTNBiaWY20UdCT-jTrJoFESjvjMmbBQECpw5AzsqjMLzHmENZPhDttECYqtwAZBsn7CESYsSdU2-luqVjyUPEXbIKNZQAkhYPXZHlnwp5I_G60HlZfRvy1SGdo9NJjRWBQGDULpfzt1RdGL8nGglBk2EWHrv3Sjjn4YVN_yPjWNTKz_QEf6P6s7LqfSyx-VfspTWIU8qgFt4vTnK4VucQ8yQ","dq":"BhZ2MdTuSXBhgnqo6yQeHPH8U3oYh2Nz9OX2o3yGr6WjCGc6d-r18tcmm1hLNcjLRhlcQIl25OuN0-1HC6a9RbaK9U772zQ7gwXdP_bAE70jyNES6KkhCYlWS2akEReWIMNfPuydFFu74uY_hgweUZFMDaDtg3j-KQ_Qc1A_TUTa3wpzlNROwvn2lS0U7-IZ2X4xl_b5wAJkzRr93aaTXJyVh4oVLenRAopiLQmLaBOpcEDc1QUqJjhUV6ogm-R8iAuTs5giCY80P1O9HCqgDQRa99HZ0JsFYXWOVddqfhnPpWGE3Xy57ChzM63E1MKa78ysf9OdNXBHbtB7vx0rOQ","qi":"QTbN_oNqyg9Zi9k2zlR4qtBZwDlDwCU6E_QrCKDY1z3pIvLFmc9eVO8aLek_GEKvvjri8voEctK-lrPRipwpdXj7cxw93cfS86vK6FSkb9plkInBfoKnC7DEOTP2Gx7WpHNQPbR8C8yFAidiRKc7lqgvRSh0LvWBzZ-spUANKAfNBaR6RAy2EAavAojeRMGxANqjqqnYP3Vwl35ZwNtmzkK_qIvsjKe3xFWMiCfzeFatunV2xUhJNrenoBoNp4z_66Xu-jUPLwRcWDdI7fz3MD3kZBH3gH4t52Amod79WxRriRW0SYcUeuvKbAi9FJv0RiCnvt0vzkjpF0XtukyHIg"}

  // Supernovas
  private publicKey = "rHHkbrqEaVXqn3g-9L7MgTWDrL4h6tyM60_ctnCsRE0";
  private arKey = {
    kty: "RSA",
    e: "AQAB",
    n:
      "8N88HAupArFkJU4tYC9Q6mYZLuNySfU3hwC0EVaveYF9N3xPxzE1_8tcygPYEugVSMOE1j1qrPmb7kpTLQ6_XzJKTCO8vdkG_I6KmFnms8quE1Ov57V8wwtSlpbziGnSV4F3OyPQ4pDDgXgDFhVhaaheNyqKlPlUHRSV02pjZh3weVTeOHOeEsc3VbJhKDQvRn-7Yo4STqIi_SHXeqkUWcX6VgkWh-wp3HF6iL-qt4zL-IiIpnI1yBr0yXWSnagZaSTpR1pwgACr0_jcVpa7WDLvjMg6CNT2zFKuxHjEXqOVPbmG18WIOE0JPuZZtw5IP3CEcbk65ETXohPMeAzDGqClk9Xv-ornaSqEpo7HPBITio4PmYA_4Ns8D2UF44zw7feJc7u9lMBrZIjsU3CLfvS9aKFNGgx8V3OWOCCKPWRlBrjNx3LTkJYoZ2GHqs2pcWtYDqAU27r5O0jl-MDvtTTnvemx1dMJbnVx-ciUrsGnJia28ppyhhPDtJL45Ly3UkExLL-AHaknLO5om7nzN_l1WppjzZWXVamSJVfp8KxYMNAewMO8c204XA8-jHiCi6O8EwJtRjuAbA6ougzhSPpLwGSG11y0KcgmHUX-qkgqYtTk7LO0TT0J-iJpgNaXcip8WxTOip2VUTjzfWQlyd24NMLIezk8gMXcNOCv9rc",
    d:
      "IPMYoOmDbCfiACxqjp7KXdYrmbtpVe6icuhIuZp3FJL_EwkBTMlRjrU98zCFbUisKLD-SeRK5HCcwQMPz7kVuqsBeNrmpb27c-73zJF3up5-I4yuIm80KuYwnQL3O3DmYiwGqGNk3qlY5SwKmAnCspZilP9Px8M3m2bGfA4wnLZ5v885OtWuCPmRezqUidBhqy4r7vZqULFjQedQN6pLa2Bmt0A1AdDvhQVM8sntS4CKImxi7Qnwi3gMhkZ8EO7-0uBGvQkFHK1609tWIM4rwIvvMv3s2mpvfFHPMHcovZ14--GWLYwK71CydBVEroLYpTz6ESh6guFb8gLtVHrCcW0YQ60dNhb41VTIzB6-MqML0WUbFNouC-ERgtmW70eKyDC304W0I46qOpR6bCOEYZwrx1K_gvGbQz38H8yGYKIajsGsW8GvLw4BJMy4oJk7fRo0L2Yc4966iTYIbiCuRdBL_G1rPkIJILZKnlVOdd_AeDa0e8xWzRn4mLWMctgIPC96XCiwttRCM-6Eghb8kZxIfS7wJW4xBKKsungxJDrmkefs0rEInPqZNaVCbTYTtbEF3KSP-8FCgXyDNxsfMSdEJnFdJVT6VkSR_sEdKps8WzVErntkei3_6Zvaa7aZIo1Ud1dbiijb1_wN6m_rG-_pIY-lyl_C1BgybmDKM2k",
    p:
      "_AtjDn82S1RYfunVaohqtadgtxZnblF_ExRuBTRSWbTrfjnj_wk5sZe3MfPgiQ64QlT0DPCogeUq5bVhmjl0-e5Kq5mhDXW61cs2nAPlCuwPb5_u1OObNvDD4zWpFWfjybWNBbs-yJaY5d3FIA2pidqmFi1evGgZNHdUD5MQU7vK-LfkctYkJEiMzluUHL_TobvQaFiXqYjeyqk05YHTOvNLmLWJE25IPQx9J3yNPlxfAF_N8A3jpCr7T5tUK7MtNUjkM3ZMth-tBJvS3Dd1e7jYpGe87d-ieipowomjhDsjAR1aO14PQqk0zhRFgQU2q2C_S2dxllTC-OXEXR9L9Q",
    q:
      "9Kb2HYKNBEujoLiwUN5YtQRooqy5pOFx06bKUesSK_N1MhB5u_jEZ5ysF3aIQ_a7qKGGEarWT3I6QPfGM3FGRlXtpVgWza50Xy8bh7VdQGj2kPh4l8F1LtcnHIovXuBMIkyyxyGwgR07aAUnRJbOcUVvCmDJNs15q--GD0IRKZZLArnFZk93rY9viB-EMAOon4Kr4PcgJzXu11UTJOO_jSCRTmfqOMNqzcOFoJ--2UM4z3Z-SOycjUZXgLIWoOSn6CeBUDr711VuCCbLR_Ew2LHkJmIuJJuKKnEDHiONrg59wDqwq6sXbZj2Pd8PvjB8CZ6bDTpuFC3Zab7wlDmYew",
    dp:
      "D8CmcEGDIzIiVcxHimD8Sl4rrUW5MSvmxUqBldGvU-v6y-jSVx48fNz-liCn5-kDmyG0HxrrbTLle3Xao8jzhqtd_1uatTymcLZCs32K0yPt0wwr4SJYkRZ7J7gy2SOlGPY_2hvZ0K-Y3sT9jQNNlVAVEU3EngHjkWPj3RVT7-fMx762iHbZy2q9YihXGXTjxTf3zo267N2hDwmERNPYX9bU4rZ12sEJwscFC3K9YShkx6E1PcugbqJBEriiihiouqvTl2PNZ5STO7aBd0IAFbt3zs6tADD59qiv43i2v4zyox8yhINccM4ifr7FmUq6H_vr-Mp-Tub9SJETtL5AAQ",
    dq:
      "Limq2tqdXSggkd0Hd9rchht02u0YgmH_pl4cYuSmIyDnBjFRpwRDmwFW_35gK-LMef8wWvkPQyJcl5GpFl_TUMY59y7t7pVyY9txqGOyWsrza1tW9duNDu-N87anRZGxC-_I9AYJVfN8GB6Q0EJcZcciMqUcknim8qhZdVuT_XLcaIFBHBL2lAsykk7QFHc8RAzV_bbjnEJy9LKa0CUhKbHxeQfmjBtjdbvk5O__hONIPu0u2ve6enXBYQk5d9ZtUELUBZ17k6ANCQC47rQ18U1vrUZtSn8GzQdR_UfcHfGiDLmGSH4aB5YLMJV8VPi1DuOcghx6VNhp46ghoPZVLQ",
    qi:
      "eL6kkB0Qvcv6uxGKf7157qyKCOPGdoPzJENLTCSThOlUK8KGOvfjc06NAwboG30u5kluD2ZolmONU2ZM7QkKghwNkMJ5zZ3V5q6slsYkhpAbLafFbj83jLJlvB8kGIpvqefKVThgQkxz_FcJyfkpNOhpYqO-ieB2Q_2VF6tqeD1VSWr-h_AyR6-2iyWoosbFqjl7H11-yJimT2lXQYGf3eljNjNhS-X9YX-Wb6rQoMMvtbbejyG46-8_oBOdq9OTHta-m8KZ37Pzwf5BYM0nz4tUIy-3j7h0h6-Mc2nYFSW_7bMua3CUi_oJmIm6w_OR8JcJBrLyebvwapcE7q700A",
  };

  globalVars: GlobalVarsService;
  GlobalVarsService = GlobalVarsService;

  constructor(private appState: GlobalVarsService) {
    this.globalVars = appState;
  }

  startUpload(file: File): Observable<string> {
    return from(
      file
        .arrayBuffer()
        .then((imgData) => this.client.createTransaction({ data: imgData }, this.arKey))
        .then((txn) => {
          txn.addTag("Content-Type", file.type);
          return this.client.transactions.sign(txn, this.arKey).then(() => txn);
        })
        .then((txn) => this.client.transactions.getUploader(txn).then((uploader) => ({ uploader: uploader, txn: txn })))
        .then((data) => {
          if (data.uploader.totalChunks > 1) {
            return [...Array(data.uploader.totalChunks - 1).keys()]
              .reduce(
                (acc, index) =>
                  acc.then(() => {
                    console.log(
                      `${data.uploader.pctComplete}% complete, ${data.uploader.uploadedChunks + 2}/${
                        data.uploader.totalChunks
                      }`
                    );
                    return data.uploader.uploadChunk();
                  }),
                data.uploader.uploadChunk()
              )
              .then((u) => data);
          } else if (data.uploader.totalChunks === 1) {
            return data.uploader.uploadChunk().then((u) => data);
          } else return data;
        })
        .then((data) => {
          console.log("Not confirmed, but uploaded to arweave. Txn id: " + data.txn.id);
          return data.txn.id;
        })
    );
  }

  ConfirmTransaction(txnId: string): Observable<boolean> {
    var isConfirmed: boolean = false;
    return from(
      [...Array(100).keys()]
        .reduce((acc, index) => {
          return acc.then((lastStatus) => {
            if (lastStatus.confirmed != null && lastStatus.confirmed.number_of_confirmations > 1) {
              return new Promise((resolve) => resolve(lastStatus));
            } else {
              return new Promise((resolve) =>
                setTimeout(() => resolve(this.client.transactions.getStatus(txnId)), Math.min(index, 40) * 10000)
              );
            }
          });
        }, this.client.transactions.getStatus(txnId))
        .then((lastStatus) => lastStatus.confirmed != null && lastStatus.confirmed.number_of_confirmations > 1)
    );
  }

  UploadImage(file: File): Observable<string> {
    if (this.globalVars.loggedInUser.ProfileEntryResponse?.IsVerified) {
      return this.startUpload(file);
    } else {
      console.log("Uploading blocked for " + this.globalVars.loggedInUser.PublicKeyBase58Check + " - NOT VERIFIED.");
      return of("");
    }
  }
}
