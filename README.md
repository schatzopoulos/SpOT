<p align="center">
  <img src="https://github.com/schatzopoulos/SciNeM/blob/master/src/main/webapp/content/images/scinem_logo_purple.png?raw=true" width="400px"/>
  <h1 align="center">Data Science Tool for Heterogeneous Network Mining (SciNeM)</h1>
  <br />
</p>

This application was generated using JHipster 6.5.1, you can find documentation and help at [https://www.jhipster.tech/documentation-archive/v6.5.1](https://www.jhipster.tech/documentation-archive/v6.5.1).

## Installation on Ubuntu

1. Determine current Ubuntu version.
   1. Use `cat /etc/os-release` to find current Ubuntu version name (e.g. Xenial, Bionic, Focal).
2. Install **mongodb** for your current version of Ubuntu (follow instructions on [this link](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)).
3. Ensure you have a Python 3 environment.
   - It is advised to use a `virtualenv` for the interface, which isolates Python package installations to a seperate environment without affecting the system's global Python environment (more information about creating and using virtual environments [here](https://docs.python.org/3/tutorial/venv.html)).
   - To retrieve the current installed Python 3 binary's path, you can use the command `which python3`.
4. Install **pandas** Python package, using the following command: `pip install -U pandas`.
5. Install and configure **Apache Spark for Hadoop 3.2+** (follow instructions on [this link](https://phoenixnap.com/kb/install-spark-on-ubuntu)). Note down the directory's path where spark is installed (for the rest of the guide this directory will be referenced as [SPARK_DIR]).
6. Create and modify a file named **spark-defaults.conf** under [SPARK_DIR]/conf.
   - Spark ships with a template file for spark-defaults.conf, named as _spark-defaults.conf.template_, which you can use to copy, with the following command `cp [SPARK_DIR]/conf/spark-defaults.conf.template [SPARK_DIR]/conf/spark-defaults.conf`.
   - Append/modify the following fields according to your needs/case: - `spark.local.dir /path/to/a/directory/with/ample/storage/capacity` - a file system path pointing to a directory where spark will save temporary files. - `spark.driver.memory 4g` - max memory that the cluster driver will use. - `spark.memory.fraction 0.6` - fraction of heap space used for execution and storage. - `spark.executor.memory 12g` - heap size alloted to each cluster's executor.
7. Install **jq** JSON processor using the following command: `sudo apt install jq`.
8. Create two directories, on a drive with ample storage capacity, which will contain the available datasets and analysis results. Note down the file system paths for these directories (for the rest of this guide these directory paths will be referenced as [DATASETS_DIR] and [RESULTS_DIR], respectively).
9. Place **at least ONE** compatible dataset to be available with SciNeM. A sample dataset can be found [here](https://scinem.imsi.athenarc.gr/content/DBLP_sample.zip).
10. Select a directory and clone into that directory the contents of the SciNeM repository using the following command `git clone --recursive https://github.com/schatzopoulos/SciNeM.git`. Note down the file system path for this directory as well (for the rest of this guide this directory path will be referenced as [CODE_DIR]).
11. Modify the contents of the Java file **Constants.java** under `[CODE_DIR]/src/main/java/athenarc/imsi/sdl/config/`.
    - Set BASE_PATH so that it points to [RESULTS_DIR]. **Make sure that the string does NOT end with a slash ('/')!**.
    - Set DATA_DIR so that it points to [DATASETS_DIR]. **Make sure that the string DOES end with a slash ('/')!**.
    - Set WORKFLOW_DIR so that it points to [CODE_DIR]/libs/SciNeM-workflows/. **Make sure that the string DOES end with a slash ('/')!**.
12. To enable the changes of environment variables, made in step 5, use the following command: `source ~/.profile`.
13. Redirect port 80 to 8181: `sudo iptables -t nat -I PREROUTING --src 0/0 --dst 0/0  -p tcp --dport 80 -j REDIRECT --to-ports 8181`

## Development

### Clone

```
git clone --recursive https://github.com/schatzopoulos/SciNeM.git
```

### Dependencies

Before you can build this project, you must install and configure the following dependencies on your machine:

1. [Node.js][]: We use Node to run a development web server and build the project.
   Depending on your system, you can install Node either from source or as a pre-packaged bundle.

After installing Node, you should be able to run the following command to install development tools.
You will only need to run this command when dependencies change in [package.json](package.json).

    npm install

We use npm scripts and [Webpack][] as our build system.

Run the following commands in two separate terminals to create a blissful development experience where your browser
auto-refreshes when files change on your hard drive.

    ./mvnw
    npm start

Npm is also used to manage CSS and JavaScript dependencies used in this application. You can upgrade dependencies by
specifying a newer version in [package.json](package.json). You can also run `npm update` and `npm install` to manage dependencies.
Add the `help` flag on any command to see how you can use it. For example, `npm help update`.

The `npm run` command will list all of the scripts available to run for this project.

### Managing dependencies

For example, to add [Leaflet][] library as a runtime dependency of your application, you would run following command:

    npm install --save --save-exact leaflet

To benefit from TypeScript type definitions from [DefinitelyTyped][] repository in development, you would run following command:

    npm install --save-dev --save-exact @types/leaflet

Then you would import the JS and CSS files specified in library's installation instructions so that [Webpack][] knows about them:
Note: There are still a few other things remaining to do for Leaflet that we won't detail here.

For further instructions on how to develop with JHipster, have a look at [Using JHipster in development][].

## Building for production

### Packaging as jar

To build the final jar and optimize the SpOT application for production, run:

    ./mvnw -Pprod clean verify

This will concatenate and minify the client CSS and JavaScript files. It will also modify `index.html` so it references these new files.
To ensure everything worked, run:

    java -jar target/*.jar

Then navigate to [http://localhost:8080](http://localhost:8080) in your browser.

Refer to [Using JHipster in production][] for more details.

### Packaging as war

To package your application as a war in order to deploy it to an application server, run:

    ./mvnw -Pprod,war clean verify

## Testing

To launch your application's tests, run:

    ./mvnw verify

### Client tests

Unit tests are run by [Jest][] and written with [Jasmine][]. They're located in [src/test/javascript/](src/test/javascript/) and can be run with:

    npm test

For more information, refer to the [Running tests page][].

### Code quality

Sonar is used to analyse code quality. You can start a local Sonar server (accessible on http://localhost:9001) with:

```
docker-compose -f src/main/docker/sonar.yml up -d
```

You can run a Sonar analysis with using the [sonar-scanner](https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner) or by using the maven plugin.

Then, run a Sonar analysis:

```
./mvnw -Pprod clean verify sonar:sonar
```

If you need to re-run the Sonar phase, please be sure to specify at least the `initialize` phase since Sonar properties are loaded from the sonar-project.properties file.

```
./mvnw initialize sonar:sonar
```

or

For more information, refer to the [Code quality page][].

## Using Docker 

You can use Docker to simplify deployment. For a minimal wrapper to set up SciNeM in a single Docker stack deployment follow the instructions [here][]


[jhipster homepage and latest documentation]: https://www.jhipster.tech
[jhipster 6.5.1 archive]: https://www.jhipster.tech/documentation-archive/v6.5.1
[using jhipster in development]: https://www.jhipster.tech/documentation-archive/v6.5.1/development/
[using docker and docker-compose]: https://www.jhipster.tech/documentation-archive/v6.5.1/docker-compose
[using jhipster in production]: https://www.jhipster.tech/documentation-archive/v6.5.1/production/
[running tests page]: https://www.jhipster.tech/documentation-archive/v6.5.1/running-tests/
[code quality page]: https://www.jhipster.tech/documentation-archive/v6.5.1/code-quality/
[setting up continuous integration]: https://www.jhipster.tech/documentation-archive/v6.5.1/setting-up-ci/
[node.js]: https://nodejs.org/
[yarn]: https://yarnpkg.org/
[webpack]: https://webpack.github.io/
[angular cli]: https://cli.angular.io/
[browsersync]: https://www.browsersync.io/
[jest]: https://facebook.github.io/jest/
[jasmine]: https://jasmine.github.io/2.0/introduction.html
[protractor]: https://angular.github.io/protractor/
[leaflet]: https://leafletjs.com/
[definitelytyped]: https://definitelytyped.org/
[here]: https://github.com/smartdatalake/docker-scinem
