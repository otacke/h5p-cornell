# h5p-cornell
Let your students take structured notes easily.

You can add this content type to amend resources such as texts, podcasts or
videos and encourage students to take 'Cornell notes'.

## Support me at patreon!
If you like what I do, please consider to become my supporter at patreon: https://www.patreon.com/otacke

## Example
!["Cornell Notes for H5P"](https://ibin.co/4sqisyJFYsjK.png "Cornell Notes for H5P")

## Getting started
Clone this repository with git and check out the branch that you are interested
in (or choose the branch first and then download the archive, but learning
how to use git really makes sense).

Change to the repository directory and run
```bash
npm install
```

to install required modules. Afterwards, you can build the project using
```bash
npm run build
```

or, if you want to let everything be built continuously while you are making
changes to the code, run
```bash
npm run watch
```
Before putting the code in production, you should always run `npm run build`.

The build process will transpile ES6 to earlier versions in order to improve
compatibility to older browsers. If you want to use particular functions that
some browsers don't support, you'll have to add a polyfill.

The build process will also move the source files into one distribution file and
minify the code.
