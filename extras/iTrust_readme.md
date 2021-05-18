### iTrust Application Build. 

* Link to the [Pipeline File](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/test-pipeline-1.yml)

This application build pipeline is mainly divided into the following 4 stages:

1. Stage (Soruce) : This stage will basically clone the iTrust repository using the credentialsId that we created during the pipeline setup phase.
2. Stage (Build and Test) : This stage is further divided into 3 steps :
    
    * Copying the application.yml file the location where iTrust repository has been cloned.
    * Building the application using ```mvn clean test integration-test checkstyle:checkstyle```
    * Running check-style checker.
3. Stage (Publish Test Coverage) : This stage deals with the code coverage part of the project. Here we use Jacoco inorder to ensure the minimum and maximum coverages necessary inorder to consider a build as successful/failure/unstable.
4. post-always : Lastly we are using post-always inorder to run the cleanup commands to kill any stray process as well as dropping the database iTrust2_test

### Jacoco coverage UI

<p align="center">
<img src="https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/extras/coverage.PNG" alt="demo"/>
</p>


### Build Result

<p align="center">
<img src="https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/extras/build.PNG" alt="demo"/>
</p>
