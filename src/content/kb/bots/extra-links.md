---
title: Extra Links
description: Extra links are a way to provide extra resources for a bot, user, team, etc.
order: 3
---

Extra links are a way to provide extra resources for your bot, such as a support server, website, GitHub/GitLab repository, and/or other links.

You can add up to 10 public and 10 private links to your bot page. A private link is used in variable substitution and is not rendered in the UI outside of this.

If you find yourself repeating the same thing over and over again, you can use *variable substitution*. To do so, create an Extra Link starting with an underscore (such as `_foo`), then use it in your description like this: `{{_foo}}` (note the double curly braces) and the value of `_foo` will be substituted in before markdown parsing or sanitization.
