# Contribution guidelines

This is intended to be a public project that anyone can participate in. If you would like to add support for new functions, fix a bug, do performance optimization etc. please read this guide.

Fork, then clone the repo:

```bash
git clone git@github.com:your-username/gb-studio.git
```

> If you're using Windows, you should clone using Symlink support, otherwise your tests will fail.
>
> To do this, you must've enabled Symlink support when installing Git for Windows.
>
> With it enabled, you must run your `git clone` command like this, with admin privileges:
>
> `git clone -c core.symlinks=true git@github.com:your-username/gb-studio.git`

Install it:

```bash
yarn
```

Push to your fork and **[submit a pull request][pr]**.

[pr]: https://github.com/chrismaltby/gb-studio/compare/

At this point you're waiting on us to accept the request. We like to at least comment on pull requests
within a week (and, typically, within 24 hours). We may suggest
some changes or improvements or alternatives.

Some things that will increase the chance that your pull request is accepted:

* [Write a good commit message](.github/COMMIT_MESSAGE_GUIDELINES.md)
