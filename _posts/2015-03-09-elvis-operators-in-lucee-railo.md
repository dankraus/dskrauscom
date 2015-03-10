---
layout: post
title: "Elvis Operators in Lucee/Railo - Thank you, thank you very much"
comments: true
pygments: true
---

Lucee and Railo (>=4.1) both support elvis operators (`?:`) and using them is quite simple. Using it, we can DRY up some code in CFML often seen to initialize objects with config/options.

In JavaScript and Ruby a common technique for intializing default options/config from a struct/hash when not provided looks something like:

{% highlight ruby %}
class MyClass
	def initialize(options)
	  option_a = options[:option_a] || 'default value 1'
	  option_b = options[:option_b] || 'default value 2'
	end
end
{% endhighlight %}

Using an `||` to use the values on the left if defined/present or use the value on the right if it's not. To do something similiar in CFML I had been accustomed to write a lot more boilerplate.

{% highlight cfc %}
component output="false" {
  public MyClass function init(struct options){
  	this.optionA = structKeyExists(arguments.options.optionA) ? arguments.options.optionA : 'default value 1';
  	this.optionB = structKeyExists(arguments.options.optionB) ? arguments.options.optionB : 'default value 2';

  	return this;
  }
}
{% endhighlight %}

Even when using ternary operators, it's still quite a long line to set up some defaults and worse if you were using a complete `if` conditional block. We're repeating the variable name twice and we all know "Don't Repeat Yourself". The elvis operator saves the day here and allows us something much more terse.

{% highlight cfc %}
component output="false" {
  public MyClass function init(struct options){
  	this.optionA = arguments.options.optionA ?: 'default value 1';
  	this.optionB = arguments.options.optionB ?: 'default value 2'

  	return this;
  }
}
{% endhighlight %}

That's it. Looks a lot more like the the Ruby example. In fact, I prefer the elvis to the or operator here. It's similar to the ternary expression in one go and is not confused with `||` a tradtional boolean operator. I could see myself doing this a lot where simple values are being assigned when needing to check for the existence of a key in a struct.

I've heard Adobe ColdFusion has implemented the elvis operator in CF11 but some reports it behaves unexpectedly and has not been fixed in any patches so you may want to sit tight if you're running Adobe CF as of right now. So far in my limited use of it in Railo, it seems to be ok.