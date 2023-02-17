function loadAnalytics() {
    var ga = document.createElement("script");
    ga.type = "text/javascript";
    ga.async = true;
    ga.src = "https://www.googletagmanager.com/gtag/js?id=G-HT1WLS626C"

    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(ga, s);
}

loadAnalytics();

window.dataLayer = window.datalAYER || [];

function gtag(){dataLayer.push(arguments);}

gtag("js", new Date());

gtag("config", "G-HT1WLS626C")

