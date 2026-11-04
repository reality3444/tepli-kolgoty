$(document).ready(function () {
    function t(t) {
        return "<span>" + (t = ("00" + t).substr(-2))[0] + "</span><span>" + t[1] + "</span>";
    }
    $("a[href^='#']").click(function () {
        var t = $(this).attr("href");
        return $("html, body").animate({ scrollTop: $(t).offset().top + "px" }), !1;
    }),
        (function e() {
            var n = new Date(),
                i = new Date();
            i.setHours(23), i.setMinutes(59), i.setSeconds(59), 23 === n.getHours() && 59 === n.getMinutes() && 59 === n.getSeconds && i.setDate(i.getDate() + 1);
            var a = Math.floor((i.getTime() - n.getTime()) / 1e3),
                s = Math.floor(a / 3600);
            a -= 3600 * s;
            var o = Math.floor(a / 60);
            (a -= 60 * o), $(".timer .hours").html(t(s)), $(".timer .minutes").html(t(o)), $(".timer .seconds").html(t(a)), setTimeout(e, 200);
        })();

        
});
