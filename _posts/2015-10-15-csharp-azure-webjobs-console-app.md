---
layout: post
title: "C# Console App on Azure WebJobs & Screen Scraper"
comments: true
pygments: true
---

My job has/is shifting away from CFML to C# and .NET. I've been boning up with some tutorials and such but it's better for me to write something I actually want to to figure out and learn stuff. I've also been working in Xamarin doing native mobile app development in C# but that's for another post.

To support a personal project, I needed address data for all of Target's store in the US and wanted to use Socrata Open Data. A coworker turned me onto it. Datasets are available via an API endpoint and can be returned as JSON (I need that for Part 2 of this project). I couldn't find a collection of the data. With a little screen scrape magic after trying to reverse engineer's Target's website's strange patterns, I managed to pull all the stores and upload to Socrata. Here's the dataset for all the [Target store locations in the US](https://opendata.socrata.com/Business/Target-Stores-in-USA/4mte-zfws) and the code to do it on [GitHub](https://github.com/dankraus/target-store-scraper-socrata-pusher).

##C# Web Scraper Console App
First I needed to find where Target had all their stores listed. They have one page with US states that links to another page with all the store locations in that state. Target did something weird on the [state directory page](http://gam.target.com/store-locator/state-listing?lnk=findstore_viewall_storesbystate). The HTML isn't rendered server side and I couldn't spot the AJAX request that had the data. I ended up just copying the HTML from the final rendered version and stuck it in a static class and static `List<string>` variable in `StateURLCollection`.

From there, I can iterate over that List, hit each page, and grab all the stores for that state. Now unsurprisingly, the content wasn't rendered by the server. This time, the data was in a JSON payload within a hidden visibility `<div>` that is rendered serverside on the original page request (yeah... go figure). Their JavaScript then deserializes it and renders on the page. Instead of parsing the HTML like I expected, I need to grab the text in the `<div>` and deserialize it myself.

I worked with a neat Ruby gem in the past doing screen scraping called Nokogiri. It lets you query the DOM with jQuery-like/CSS-like selectors. I prefer this to some sort of XML-like parser because it seems I have an inability work with XPath effeciently. I found [CsQuery](https://github.com/jamietre/CsQuery) which does the trick like NokoGiri. It even has HTTP abstraction so I can make the request and get a workable object back in one go.

{% highlight c# %}
var stateStoresDOM = CQ.CreateFromUrl(stateURL);
var storeJSON = stateStoresDOM["#primaryJsonResponse"].Text();
{% endhighlight %}

Now with the JSON string, it can be deserialized into a `State` object. This is why Json.Net is way cool. It goes right into a strongly typed object. You can even rename the keys to property names of your choice with convient decorators.

{% highlight c# %}
var state = JsonConvert.DeserializeObject<State>(storeJSON);
{% endhighlight %}

{% highlight c# %}
class State
{
    [JsonPropertyAttribute("storeList")]
    public List<Store> Stores { get; set; }
    public string StateName { get; set; }
    public string StateCode { get; set; }
}
{% endhighlight %}

{% highlight c# %}
class Store
{
    public string TypeDescription { get; set; }
    public string StoreName { get; set; }
    public string Street { get; set; }
    public string State { get; set; }
    public string FormattedStoreName { get; set; }
    public string City { get; set; }
    public string Country { get; set; }
    public string StoreNumber { get; set; }
    public string Market { get; set; }
    public string PhoneNumber { get; set; }
    public string County { get; set; }
    public string IntersectionDescription { get; set; }
    public string ZipCode { get; set; }
    public string LegalStoreNumber { get; set; }
    public string FormattedAddress { get; set; }
}
{% endhighlight %}

As I iterate over each state, I grab all the states and add them to a running list of all the states. Then, that list gets deserialized to JSON and pushed up to Socrata with SODA.NET. The Socrata dataset has the same column names as the Store properties.

{% highlight c# %}
var sodaClient = new SodaClient("opendata.socrata.com",
    ConfigurationManager.AppSettings["socrataAPIKey"],
    ConfigurationManager.AppSettings["socrataUsername"],
    ConfigurationManager.AppSettings["socrataPassword"]);

var targetStoresInUSAJSON = JsonConvert.SerializeObject(targetStoresInUSA);
Console.WriteLine("Upserting to Socrata");
sodaClient.Upsert(targetStoresInUSAJSON, SodaDataFormat.JSON, ConfigurationManager.AppSettings["socrataResourceId"]);
{% endhighlight %}

I wanted to put this up on GitHub so I needed a way to store my Socrata API credentials safely and not juggle deployments to Azure. `Àpp.Config`, makes for a good place to add these. These can be set later in Azure and it will override what's in the file. Cool!

{% highlight xml %}
<?xml version="1.0" encoding="utf-8" ?>
<configuration>
    <startup>
        <supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.5.1" />
    </startup>
    <appSettings>
        <add key="socrataAPIKey" value=""/>
        <add key="socrataUsername" value=""/>
        <add key="socrataPassword" value=""/>
        <add key="socrataResourceId" value=""/>
    </appSettings>
</configuration>
{% endhighlight %}

##Azure

Azure can run .NET console apps as scheduled jobs. You need to create a new Web App first, push your code to it (I'm pushing to it with Git which is really cool, a lot like Heroku) and then configure the WebJob by uploading a zip file of the console app and schedule it to run as you see fit. Needing to create it as a WebApp first threw me off initially. Why you need to upload a zip file of the console app but then later can update it and redeploy with a normal `git push azure` deployment, I'm not sure.

As of writing, scheduled WebJobs need to be created using the original Azure interface (the one with the blue icon bar on the right for all the services) rather than the new one (with the horizontal scrolling panels). That also threw me off because I'm trying to use the new portal more since that's where they'll eventually move to - plus it is pretty cool. Just needs some taking used to.

In the Configure > App Settings section for the Web App, you can add your real credentials as key/val pairs.

##Summary
The biggest impediment was picking apart Target's website to figure out where and how they were rendering content. If that was looking like a dead-end, I suppose maybe running a PhantomJS headless browser somewhere and using that as a proxy to get the rendered content. Cumbersome. I might have lost interest at that point!

 After that, it's was a matter of setting up the dataset on Socrata Open Data, and very little C# to collect the data and upload it thanks to the help from easy to use open source libraries. I learned a bit more about Azure services and got more comfortable with C# and .NET.

 Now on to the real reason I needed Target store locations...

