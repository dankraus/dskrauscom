---
layout: post
title: "SendGrid-CFML: Wrapper Lib and ColdBox Module"
comments: true
---

I've released a wrapper library to send email with SendGrid that is also packaged as a ColdBox module. Checkout [sendgrid-cfml](https://github.com/dankraus/sendgrid-cfml). It's on [ForgeBox](http://www.coldbox.org/forgebox/view/sendgrid-cfml) too! From inside CommandBox, you can do `install sendgrid-cfml` and install the module and add it as a dependency to your project in the `box.json` in one go! I still have to write documentation but there are a few examples for working with it.

I referenced SendGrid's official [NodeJS](https://github.com/sendgrid/sendgrid-nodejs) and [PHP](https://github.com/sendgrid/sendgrid-php) libraries. It covers everything (I'm pretty sure!) in their Web API. This was a great project to get more comfortable writing tests.

## Stuff I've learned from this project:

* Again, it's so nice to be able to refactor a bunch of stuff and be confident things still work. WRITE TESTS!

* CommandBox is pretty slick. It was very handy to spin up a server and run my TestBox tests. Package management is sweet and it's high-time the CFML world has something.

* Also my first go into a ColdBox module, referenced some other projects for implementation. See the [sendgrid-cfml project on GitHub](https://github.com/dankraus/sendgrid-cfml) page for thanks.

* I've never read environment variables with CFML before. That was handy to publish tests without my SendGrid credentials in place. Quite Easy!

        var system = createObject("java", "java.lang.System");
        var env = system.getenv();
        var sgUsername = env['SENDGRID_USERNAME'];

* I've also never used RamDisk before. This library lets you attach files to an email by referencing a URI. It downloads the file and stores it in RamDisk, sends it in the API request, and deletes it. Basically works just like any other file.

        this.ramDiskFolder = 'ram:///sendgrid-cfml#GetTickCount()#/';

        private string function writeToRamDisk(required string filename, required binary content) {
        var ramPath = '#this.ramDiskFolder##arguments.filename#';
            if(not directoryExists(this.ramDiskFolder)){
                 directoryCreate(this.ramDiskFolder);
            }
            fileWrite('#this.ramDiskFolder##arguments.filename#', arguments.content);

            return ramPath;
        }