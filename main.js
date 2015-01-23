$(function(){
    /**
    * TODO: cache this?
    */

    var allRepos = [];
    var allPrs = [];
    var api_key = "";

    $(document).ajaxStop(processData); // for when we're done
    $.get("https://api.github.com/orgs/adaptlearning/repos" + api_key, {}, getData);

    function getData(repos) {
        allRepos = repos;
        for(var i = 0, length = repos.length; i < length; i++) {
            var pullsURL = repos[i].pulls_url.substr(0,repos[i].pulls_url.length-9);
            $.get(pullsURL + api_key, {}, function(prs){
                if(prs.length > 0) allPrs.push(prs);
            });
        }
    }

    function processData() {
        for(var i = 0, length = allRepos.length; i < length; i++) {
            for(var j = 0, length = allPrs.length; j < length; j++) {
                if(allPrs[j][0].base.repo.id == allRepos[i].id) {
                    allRepos[i].pull_requests = allPrs[j];
                    allRepos[i].plus_ones = 3;
                }
            }
        }

        render();
    }

    function render() {
        $(".loading").addClass("hidden");
        $(".inner").fadeIn();

        for(var i = 0, length = allRepos.length; i < length; i++) {
            var repo = allRepos[i];
            if(repo.pull_requests) renderRepo(repo);
        }
    }

    function renderRepo(repo) {
        var htmlData = "";

        htmlData += "<div class='repo " + repo.name + "'>";
            htmlData += "<div class='title'>";
                htmlData += "<h3>" + repo.name + "</h3>";
            htmlData += "</div>";

        for(var j = 0, count = repo.pull_requests.length; j < count; j++) {
            var pr = repo.pull_requests[j];
            htmlData += "<a href='" + pr.html_url + "' target='_blank'>";
                htmlData += "<div class='pr'>";
                    htmlData += "<div class='title'>" + pr.title + " (#" + pr.number + ")</div>";
                    htmlData += "<a href='" + pr.user.html_url + "' target='_blank'>";
                        htmlData += "<div class='author'>" + pr.user.login + "</div>";
                    htmlData += "</a>";
                htmlData += "</div>";
            htmlData += "</a>";
        }
        htmlData += "</div>"

        $(".content").append(htmlData);
    }
});
