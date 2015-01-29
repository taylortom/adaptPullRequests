$(function(){
    var allRepos = [];
    var allPrs = [];
    var api_key = "";
    var templateData;

    init();

    function init() {
        storeTemplateData();

        // get going when the data's here
        $(document).ajaxStop(processData);

        $.get("https://api.github.com/rate_limit" + api_key, {}, setApiInfo);
        $.get("https://api.github.com/orgs/adaptlearning/repos" + api_key, {}, getData);
    }

    function setApiInfo(data){
        $(".api_limit").html(
            "API calls left: " + data.rate.remaining + "/" + data.rate.limit
        );
    }

    function storeTemplateData() {
        templateData = Handlebars.compile($(".template").html());
        $(".template").remove();
    }

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
                }
            }
        }
        render();
    }

    function render() {
        $(".loading").addClass("hidden");
        $(".inner").fadeIn().removeClass("hidden");

        var html = templateData({ repos: allRepos });
        $(".content").append(html);
    }
});
