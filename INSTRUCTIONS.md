SpotOn.it Software Engineering Challenge

At SpotOn.it, we have a set of crawlers that extract structured activity data from pages on many websites. One of the major obstacles we faced was identifying whether each page actually contains this activity data or not -- we needed a solution that could return a comprehensive list of activities from each site, but also was scalable enough to use with all of the sites in our database.

Your challenge is along the same vein. We’ve attached a list of URLs below, each containing one activity. We want you to write an application that when given a URL, returns 10 other URLs on the same site (root domain) that are also event urls.

[For example, if the URL given to you was http://www.eventbrite.com/e/sausalito-art-festival-2014-tickets-11831764125?aff=ehometext&rank=0 - after running your algorithm, the results would be along the lines of [http://www.eventbrite.com/e/oktoberfest-by-the-bay-2014-tickets-12291900405?aff=ehometext&rank=2, http://www.eventbrite.com/e/large-ai-weiwei-on-alcatraz-early-bird-tickets-tickets-12011012261?aff=ehometext&rank=3, ….] - it isn’t necessary for the list of outputted URLs to be similar events to the original URL. Also, make sure the URLs being outputted only have one event on them, i.e. not a page listing multiple events. In the above example, http://eventbrite.com would not be good URL to return.]  

Your solution will be judged based on its precision (the fraction of returned URLs that actually contain activities), its scalability (can it be used on a site not on the list?), and its simplicity (the less complex code, external libraries, and memory used, the better). We know it’s a challenging problem so we don’t expect your solution to be perfect -- just send us what you can come up within a reasonable amount of time!

You can write this using whatever language/framework you want, and using whatever libraries you deem necessary. The only requirement is that you provide an API to send a URL to your application, and return the 10 corresponding URLs in an appropriate way. 

When you are done, please submit your code along with instructions on how to run it. Good luck!

Here are the URLs we will be testing:
http://calendar.boston.com/lowell_ma/events/show/274127485-mrt-presents-shakespeares-will
http://www.sfmoma.org/exhib_events/exhibitions/513
http://www.workshopsf.org/?page_id=140&id=1328
http://events.stanford.edu/events/353/35309/
