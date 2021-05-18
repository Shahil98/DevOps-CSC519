# Milestone-3
This is the repository for the project submission to Group-16

### Checkpoint File 
* The [1st Milestone Checkpoint Report](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/CHECKPOINT.md) contains a description of all the work that we have done for the first checkpoint.

* The [2nd Milestone Checkpoint Report](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/CHECKPOINT-M2.md) contains a description of all the work that we have done for the second checkpoint.

* The [3rd Milestone Checkpoint Report](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/CHECKPOINT-M3.md) contains a description of all the work that we have done for the third checkpoint.

### Project Setup

***1***. Clone this repository using ``` git clone https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16.git ```

***2***. Inside the root folder run ``` npm install ```

***3***. Inside the root folder run ``` npm link --force ```

***4***. Create a file ``` .vault-pass ``` with the content ``` csc-devops-2020 ```

### Project Implementation

***1***. Run **``` pipeline setup --gh-user <username> --gh-pass <password>```** which would do the following things :
* Creates a virtual machine at I.P. ```192.168.33.20```. 
* Installs Ansible on the Virtual Machine.
* Runs ```setup``` role which would install JDK and Jenkins.
* Runs ```config_jenkins``` role for changing Jenkins port to 9000, unlocking Jenkins, and installing necessary plugins.
* Runs ```build environment``` role that installs nodejs, npm, and mongoDB.
* Runs ```configure_mongodb``` role which would do the necessary configurations changes for mongoDB.
* Runs ```jenkins-job-build```.
* Runs ```setupl_iTrust``` role which does all the configuration setup necessary for building and running iTrust application.


***2***. Run ***``` pipeline build <job-name> -u <usrname> -p <password> ```***
* Creates a job ``` <job-name> ``` for user having username ```<usrname>``` and password ``` <password> ```.
  * job-name should be either **iTrust** or **checkbox.io** .
  
***3***. Run ***``` pipeline prod up```***
* Creates 3 droplets for hosting monitor, iTrust and checkbox.io.
* Generates an inventory.ini file which will further be used for deploying applications.

***4***. Run ***``` pipeline deploy <iTrust or checkbox.io> -i inventory.ini```***
* Deploys the specified application.
* ***Note:**** In order to deploy on digital ocean you may need to run [line-1](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/commands/deploy.js#L45) and [line-2](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/commands/deploy.js#L51) as sudo user.

***4***. Run ***``` pipeline canary <branch-name> <branch-name>```***
* Performs canary analysis using a green and a blue VM.

### Experience and learnings through milestone 1, 2 and 3

***1***. **Importance of Ansible as a CM tool**
* One of the major learnings or takeaways from the first phase of the project was the importance of writing idempotent script. We got to learn about how Ansible helps us in doing the same, and also experienced that writing YML Ansible script is comparatively way more easier than writing bash scripts. Moreover, we also thought the community support for Ansible is very huge and so we did not face any issues while figuring out the proper commands for our desired tasks.

***2***. **Importance of Jenkins as a CI tool**
* Secondly, we got to learn about usage of Jenkins in Devops methodology and various different ways to setup a Jenkins job/pipeline. While surfing over the internet we got know about how different plugins ranging from build tools to test tools are available in Jenkins. Moreover, we got know about different features of Jenkins which can help us in achieving  Continuous Integration.

***3***. **Usage of Jacoco to ensure proper build results** 
* We got to learn about how Jenkins can be extremely useful when the users know which plugins to use. One such plugin
 that we got to know was jacoco, which basically ensures that a build is considered as a success or failure based the
  code coverage the tests report. This tool can be very useful for us in the near future as it possibly cuts a lot
   manual work.

***4***. **Using Mutations to ensure the quality of test suite**
* One of the major learnings from this project was the way we utilized different sorts of mutations to our code base
 in order to ensure the quality of our test suite. When we ran such mutations for 1000 iterations, we got know which
  sort of mutations might lead to such errors. We found this technique time consuming, but quite interesting.

***5***. **Using Static Code Analysis To Check For Bad Code Smells**
* We learnt that before building the code and running the tests, we can look for bad code smells like long methods, many nested if statements etc that can result in bugs later.

### Issues Faced

* While running our script we faced some issues where our Jenkins url was not reachable. Later we got to know about the need for some timeout after initiating the Jenkins start/restart. After setting up static timeout we saw that sometimes Jenkins was not able to properly restart in the given time and so we were still facing similar issues that we faced before putting a timeout. Lastly, we wrote few commands for dynamic timeout inorder to deal with this issue.

* Initially we wrote a groovy script to activate jenkins, but the username and password was openly visible. Such confidential data should not be visible and thus in order to hide the credentials we used the jenkins_script module of ansible where we can write the groovy script and this script could use Ansible Environment variables. Thus, our credentials are not visible openly in any of our code.

* One of the issues we faced while trying to build the iTrust Application was dealing with errors which we had no idea about. We treated iTrust code as a blackbox while trying to build it and we think that due to that we had a hard time while solving such errors. Some of the errors were solved by simply alloting more memory to our Virtual Machine and so if we had a proper idea about the requirements of the application then we would have been able to solve such errors efficiently.

* We came across a lot of issues while dealing the fuzzing part of the code. While doing random mutations we came across some mutations which would lead to compilation errors which might not be useful for us. Thus, we spent a lot of time while deciding which type of mutations to implement. Moreover, running 1000 iterations of useful-tests was very time consuming and there were times when we got to know about a small bug in our code due to which we had to run all the iterations from scratch.

* One of the major issues that we faced was while accessing the id_ssh_rsa file in order to communication with the droplets. When we have to deploy the applications on the droplets we had to give them root access as their id file was in a certain location. But, when we tried to deploy the applications locally, we had to give the ansible playbooks vagrant access rather then the admin access because of the location of the desired file. Agter a lot of debugging we found that this happened as we were using commands with sudo.

* We faced a lot of issues while deploying the checkbox.io application on the droplet. The application seemed to running but preview of the markdown was not visible correctly. After few debugging session we were able to rectify the mistake and solve it.

### Section Specific Details

1. Automatically configure a build environment and build job for iTrust. [Link to File](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/extras/iTrust_readme.md)

2. A test suite analysis for detecting useful tests. [Link to File](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/extras/tests_readme.md)

3. Implement a static analysis for checkbox.io [Link to File](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/extras/static_code_readme.md)

### Screencast Link

## 1st Milestone ScreenCast
[Full Screencast](https://drive.google.com/file/d/1xfqlBWYE-xa1OmShxDHRbhww94Br05dN/view?usp=sharing)

## 2nd Milestone ScreenCast
[Full Screencast](https://drive.google.com/file/d/1Q15jcHwLN0tZMC2yOseSpVNraT-coISw/view?usp=sharing)

## 3rd MileStone ScreenCast
1. [Includes Provision Instance and Configuration steps for deployment](https://drive.google.com/file/d/1piSAYfa3sBhGMSzVPA69iYNFmD80pk-e/view?usp=sharing)
2. [Includes Canary Analysis](https://drive.google.com/file/d/1UWGkTfQx5agQyhJshJiKhHQVsiduzJ75/view?usp=sharing)

## Final Demo Video
1. [Included all the functionalities](https://drive.google.com/file/d/1cLUZeYz1zmXepuSY6foDup5WRZD8EEPC/view?usp=sharing)
