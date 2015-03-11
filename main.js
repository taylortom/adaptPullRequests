$(function(){
    var allRepos = [];
    var allPrs = [];
    var todaysPrs = [];
    var ajaxQueue = 0;
    var api_key = "";
    var templateData;

    init();

    function init() {
        storeTemplateData();

        // get going when the data's here
        $(document).ajaxStop(onAjaxStop);

        $.get("https://api.github.com/rate_limit" + api_key, {}, setApiInfo);

        // have to check the org and the user
        ajaxQueue = 2;
        $.get("https://api.github.com/users/adaptlearning/repos" + api_key, {}, storeRepos);
        $.get("https://api.github.com/orgs/adaptlearning/repos" + api_key, {}, storeRepos);
    }

    // data manipulation

    function setApiInfo(data){
        $(".api_limit").html("API calls left: " + data.rate.remaining + "/" + data.rate.limit);
    }

    function storeRepos(repos) {
        ajaxQueue--;

        for(var i = 0, len = repos.length; i < len; i++) {
            if(allRepos.length == 0) { allRepos.push(repos[i]); return; }

            var found = false;
            for(var j = 0, len2 = allRepos.length; j < len2; j++) {
                if(repos[i].id === allRepos[j].id) found = true;
            }

            if(!found) allRepos.push(repos[i]);
        }

        if(ajaxQueue == 0) getData();
    }

    function getData() {
        for(var i = 0, length = allRepos.length; i < length; i++) {
            var pullsURL = allRepos[i].pulls_url.substr(0,allRepos[i].pulls_url.length-9);
            $.get(pullsURL + api_key, {}, function(prs){
                if(prs.length > 0)  {
                    allPrs = allPrs.concat(prs);
                    for(var i = 0, length = allRepos.length; i < length; i++) {
                        if(prs[0].base.repo.id === allRepos[i].id) {
                            allRepos[i].pull_requests = prs;
                        }
                    }
                }
            });
        }
    }

    function sortData() {
        allRepos = allRepos.sort(function(a,b) {
            if(a.name < b.name) return -1;
            if(a.name > b.name) return 1;
            return 0;
        });

        allPrs = allPrs.sort(function(a,b) {
            if(a.updated_at < b.updated_at) return 1;
            if(a.updated_at > b.updated_at) return -1;
            return 0;
        });

        for(var i = 0, len = allPrs.length; i < len; i++) {
            // today at midnight
            var today = new Date(); today.setHours(0); today.setMinutes(0).toString;
            var d = new Date(allPrs[i].updated_at);
            if(d > today) {
                todaysPrs.push(allPrs[i]);
                var hours = (d.getHours() < 10) ? ("0" + d.getHours()) : d.getHours();
                var mins = (d.getMinutes() < 10) ? ("0" + d.getMinutes()) : d.getMinutes();
                allPrs[i].last_updated_formatted = hours + ":" + mins;
            }
        }
    }

    // rendering

    function storeTemplateData() {
        templateData = Handlebars.compile($(".template").html());
        $(".template").remove();
    }

    function render() {
        var remaining = allPrs.length;
        if(remaining == 0) remaining = "no"
        $(".outstanding_prs .number").html(remaining);

        $(".loading").addClass("hidden");
        $(".inner").fadeIn().removeClass("hidden");

        var html = templateData({ repos: allRepos, today: todaysPrs });
        $(".content").append(html);

        setupListeners();
    }

    function setupListeners() {
        $(".min").click(function(event) {
            event.preventDefault();
            $(this).next(".prs").slideToggle();
        });
    }

    // events

    function onAjaxStop() {
        sortData();
        render();
    }
});
