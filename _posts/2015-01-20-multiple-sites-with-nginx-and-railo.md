---
layout: post
title: Configuring Multiple Sites with nginx and Railo
comments: true
---

[Nano Breither](dnano.github.io) wrote up a really great post on using nginx with Railo and Tomcat. I recommend reading that [post](http://dnando.github.io/blog/2015/01/05/advantages-of-nginx/) first if you're looking for info on Railo and nginx as your webserver. I wrote up a lengthy-ier comment thought I'd toss it up here too as I haven't seen much info on Nginx and applying it to Railo. I've been running nginx having it proxy to Railo for years. To be honest, I've never missed Apache and I certainly don't miss IIS (I've only ever used it with Adobe ColdFusion anyway).

##Load Balancing

I mentioned some really handy options available for load-balancing and reduancy. Nginx supports a few more directives in the upstream configuration which are really awesome. You can define weight/priority to each server so more requests go to one server over others. You can also temporarily mark one as "down" so it is ignored, but without having to remove it outright from your config. Don't forget about using `nginx reload` instead of `restart` here. It is much faster and will just reload your config file(s) without tearing the whole thing down and starting up fresh. This means you can mark some servers as 'down' and apply the directive without taking down access to other sites/servers as well. Plus, the beauty of `reload` means that it verifies your configuration is error-free before applying it. A restart would fail cause nginx to fail during startup because of a bad configuration leaving everything down while you hunt for that missing semi-colon.

You can define maximum response times or failure counts for any upstream server so nginx will stop sending incoming requests to it like if for some reason it is crashing, crashed, bogged down, terrible network latency, etc. That plays nicely with defining servers as exclusively functioning as backups so that requests will only ever go there when the others are unavailable.

[This is a great post on some nginx load-balancing options](http://blog.jsdelivr.com/2013/01/nginx-load-balancing-basics.html)

##Configurations for multiple Railo sites on same server.

If you want your nginx server to proxy to multiple sites or applications. There are a few options I've tried, each with pros and cons. I don't stick with one method exclusivley. My experience is really based around Jetty instead of Tomcat but configurations, XML, names, and paths are pretty similar. The gist is you have and XML config for the overall Jetty server (`~jettyhome/etc/jetty.xml`) and then one for each context (~jettyhome/livecontexts/somedomain.xml`).


###Option 1
####Multiple nginx servers, multiple Jetty connectors on different ports.

We'll need to define multiple servers with the server_name in nginx for each domain and proxy to Jetty with each using different ports.

From your Nginx config:

    server {
      listen 80;
      server_name thedomain.com;
      location /{
        proxy_pass http://127.0.0.1:8087;
      }
    }

    server {
      listen 80;
      server_name adifferentdomain.com;
      location /{
        proxy_pass http://127.0.0.1:8088;
      }
    }

Then, define new contexts in: `~jettypath/livecontexts/thedomain.com.xml` and `~/jettypath/livecontexts/adifferentdomain.com.xml``

Each context would have something like:

    <!-- ~jettypath/livecontexts/thedomain.com.xml -->

    <set name="contextPath">/</set>
    <set name="resourceBase"><systemproperty name="jetty.home" default="."/>/webapps/somedomain/</set>
    <set name="connectorNames">
      <array type="String">
        <item>thedomain</item>
      </array>
    </set>

Then in `~jettypath/etc/jetty.xml`, I add a connector for each context. This is where you give the connector a name and tell it what port to listen on. Here's a connector for "somedomain"

	<!-- ~jettypath/etc/jetty.xml -->
    <call name="addConnector">
      <arg>
        <new class="org.eclipse.jetty.server.nio.SelectChannelConnector">
          <set name="name">thedomain</set>
          <set name="host"><systemproperty name="jetty.host"/></set>
          <set name="port"><systemproperty name="jetty.port" default="8087"/></set>
          <set name="maxIdleTime">30000</set>
          <set name="Acceptors">2</set>
          <set name="statsOn">false</set>
          <set name="forwarded">true</set>
          <set name="confidentialPort">8443</set>
          <set name="lowResourcesConnections">20000</set>
          <set name="lowResourcesMaxIdleTime">5000</set>
        </new>
      </arg>
    </call>

In this example - a request for somedomain.com will hit nginx, proxy over to Jetty running on the same server, who has a connector called "thedomain" listening on 8087, will look at the contexts that were loaded on Jetty server startup looking for a context using the connector name "thedomain" and then point it to `~jettyhome/webapps/somedomain`. These connectors are basically just ports to listen on that have been named so they can be referenced elsewhere.

Pros: to me it seems a bit more explicit, one app, one port, one place for it to connect, it's assigned a name and a place.

Cons: You need to add another connector to the sever config and context XML for each app/site. Adding or changing context XML's or the server's XML will require a full Jetty restart. Not fun if you want to load something up in the middle of the day on an existing production server that's being used heavily.

### Option 2
####Virtual Hosts

Another way I've done it: specify a virtual host instead of a connector name for the context to listen for. Have the entire Jetty server listen only on one port. That means only one connector in its config. Next, define each server in nginx like above in Option 1. Set up multiple contexts for each site like above except instead of connectors, we'll use virtual hosts.

    <!-- ~jettypath/livecontexts/thedomain.com.xml -->

    <set name="defaultsDescriptor"><systemproperty name="jetty.home" default="."/>/etc/webdefault.xml</set>
    <set name="virtualHosts">
      <array type="String">
        <item>somedomain.com</item>
        <item>somedomainalias.com</item>
      </array>
    </set>

Pros: You dont need to add a connector for every site juggling multiple ports.

Cons: Now Jetty is concerned with the domains coming in and figuring out where to go rather than using nginx as your primary gatekeeper. If you need to change or add an additional domain to point to the site/app, you will need to remember to update the context with that new domain.


###Option 3
#### Multiple Jetty servers

The third way I've tried (my least preferred) is to have multiple Jetty servers, one for each site/application and each running on a different port Nginx proxies to it the same way as if you were configuring it for only one site. This time it's just to entirely different Jetty instances that are running, each on their port.

Pros: Config is a little easier, less meddling with Jetty contexts and the like. If one app crashes or something, it's only that one site, not all the others.

Cons: Gets a bit confusing know what app runs on which Jetty instance. I tend not to like doing it this way. If they are big apps, I'd rather spin up a new VM on my host and have one server dedicated to one app.

---

So there you have it, three methods to run multiple sites with Railo (or anything on Jetty I suppose!) behind nginx. I think you'll find nginx's configuration options to be really powerful and natural. I enjoy working with it and never find it to be very difficult itself. The proxy capabiity is really nice and you can see how you can send incoming requests anywhere you like without the need for complex connectors between your application server and webserver.