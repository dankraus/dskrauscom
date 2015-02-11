---
layout: post
title: Configure Railo Sessions with Redis
comments: true
---

Recently, I've been putting thought into scalability and redundancy for Railo application servers. Some of the thoughts came out of my [previous post](http://www.dskraus.com/2015/01/20/multiple-sites-with-nginx-and-railo/) on nginx and load balancing from the web server. Session management is often the elephant in the room. Some load balancers offer sticky sessions so that users get assigned to a server and stay there until session expiry. I think the ideal scenario is round-robin where requests can hit any server in the pool so load is spread evenly across the system. If you need to take down a server for maintenance or something crashes, it'd be really nice to not inconvenience your users by losing what they were working on and needing to log back in.

Railo offers a few different methods of session storage but the most common tend to be either stored in memory or in a database. Keeping them in memory is nice because it's fast and you can store complex data, but it's stored only that particular server. If something crashes, so do the sessions. Memory is used up by your application doing its thing and also maintaining sessions for all those users. More users, more memory usage. Database storage allows you to have multiple application servers persist sessions in some tables. There's of course overhead in making trips to the database to check session integrity but you free up memory on your application server.

Wouldn't it be nice to have some of the best of both worlds?

I'm far, far from an expert on the topic but I've been doing some research and experimentation. What I've found is that [Redis](http://redis.io/) seems to be a good candidate to get us fast session storage and being available for multiple servers allowing us to take that round-robin load balancing approach. To be honest, I've only been tinkering with Redis for the day but it's been on my radar for a long, long time. It's a frequently used data structure storage mechanism to use in caching with ability to persist the data if you want it to (at some cost of performance naturally). I won't go too deep into it as there are far better resources that explain it. I didn't see any really straight forward examples of plugging Redis into Railo for session storage so I wanted to outline it here. I was impressed how easy it was.

##Setup

First off, I thought I was going to need to leverage [Jedis](https://github.com/xetorthio/jedis) (not the Force-wielders from a galaxy far, far, away) and write a Railo extension (never done that before). But alas, Andrea Campolonghi has already been down that path and [made one available](http://www.getrailo.org/index.cfm/extensions/browse-extensions/rediscache/www.andreacfm.com). Awesome!

1. Install The Railo Redis Extension

Go to Extension>Applications from the Railo Server context admin. This MUST be in the server context and therefore available to all contexts on this server. Redis should already be there as an available extension. Click it, and then click install.

![image](/public/images/2015-02-11-railo-sessions-redis/railo-extensions.png)

2. Add a Redis Cache.

Still in the Railo Server context admin, go to Services>Cache and create a new cache connection. I gave it the very relevant name of 'railoSessions' but call it whatever. Make sure Redis is selected from the Type dropdown

![image](/public/images/2015-02-11-railo-sessions-redis/redis-cache.png)

3. Configure the cache connection for sessions.

Check off 'Allow to use this cache as client/session storage.' for the storage option. Add the address and port of where your Redis server is running. Give it a namespace if you'd like. Set the Default option to Object and submit to save.

Make sure your server's Session Type is CFML and not J2EE set in Settings>Scope.

![image](/public/images/2015-02-11-railo-sessions-redis/redis-cache-setup.png)

4. Configure your app via Application.cfc

`this.sessionStorage` is the name of the Redis cache you added in #2. I'd give the server a restart now too. That's it. Really.

    this.sessionManagement = true;
    this.sessionStorage = 'redisSessions';
    this.sessionCluster = true;
    this.sessionTimeout = createTimeSpan(0,0,30,0);
    this.setClientCookies = true;

You can store structs, strings, and arrays in your sessions with `session.isLoggedIn=true` like you would with any other session. I have not tried components or query results yet. Keep in mind, the more you store, the more memory you'll consume. It's generally not good design to bloat your sessions.

5. Bonus

You can now also use Redis with standard CFML cache functions like `cachePut('youKey', ['a','b','c']);` and `cacheGet('yourKey');`
