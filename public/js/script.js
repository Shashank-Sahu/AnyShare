const pageUrl = $(location).attr("href");
const page = pageUrl.substring(pageUrl.lastIndexOf("/") + 1, pageUrl.lenght);
const time = new Date().getFullYear();
if (page)
    $("#" + page).addClass("active");

$("#time").text(time);