"use strict";

const glob = require("glob");
const path = require("path");
const fs = require("fs-extra");

const pathRegexp = /\.\/src\/(?<language>[^/\s]+)\/(?<module>[^/\s]+)\/(([^\s/]+\/)+)?(?<name>[^/\s.]+)(\.?(?<ext>[^/\s.]+))?/;

function generateLanguageFile(language) {
  const data = [];

  glob.sync(`./src/${language}/**/*.js`).forEach(function(file) {
    const fileContent = require(path.resolve(file));
    const transformedContent = {};
    const { module } = file.match(pathRegexp).groups;

    Object.keys(fileContent).forEach((key) => {
      transformedContent[`[${module}] ${key}`] = fileContent[key];
    });

    data.push(transformedContent);
  });

  fs.outputJsonSync(`dist/${language}.json`, Object.assign({}, ...data), { spaces: 2 });
}

function generateReadme() {
  glob.sync("./src/**/*.js").forEach(function(file) {
    const toc = [];
    const readMe = [];
    const fileContent = require(path.resolve(file));
    const { language, module, name, ext } = file.match(pathRegexp).groups;
    const mdFilePath = `docs/${language}/${module}/${name}.md`;

    Object.entries(fileContent).forEach(([key, value]) => {
      const anchor = key.replace(/[^\w\s]+/g, "").replace(/\s/g, "-").toLowerCase();
      
      toc.push({ key, link: `#${anchor}`});
      
      const body = value.body
        .replace(/(?<=\${\d+:\S+)}/g, "")
        .replace(/\${\d+:?}?/g, "")
        .replace(/\t/g, "  ");

      readMe.push(`### \`${key}\``);
      readMe.push(`**Prefix:** \`${value.prefix}\`\n`);
      readMe.push("**Description**:");
      readMe.push("```");
      readMe.push(value.description);
      readMe.push("```");
      readMe.push("**Generated code**:");
      readMe.push(`\`\`\`${ext}`);
      readMe.push(`${body}`);
      readMe.push("```");
    });
    
    readMe.unshift("## Snippets");
    readMe.unshift(toc.map((el) => `- [${el.key}](${el.link})`).join("\n"));
    readMe.unshift("## Table of Contents");
    readMe.unshift(`# ${language} - ${module}`);
    fs.outputFileSync(mdFilePath, readMe.join("\n"));
  });
}

fs.emptyDirSync("dist");
generateLanguageFile("javascript");
generateLanguageFile("handlebars");

fs.emptyDirSync("docs");
generateReadme();