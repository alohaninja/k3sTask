[![Build status](https://dev.azure.com/k3sci/kubeci/_apis/build/status/Publish%20k3s%20Extension)](https://dev.azure.com/k3sci/kubeci/_build/latest?definitionId=2)

# k3s CI Azure Devops Task

![k3s Task](https://user-images.githubusercontent.com/26234626/88642414-4e33f380-d075-11ea-941d-49a499c424b7.png)

Creates a k3s cross-platform cluster for CI testing.  

## Configuration

1. Install [this extension](https://aka.ms/k3stask) to your project ADO tenant. 

    ![k3s install](https://user-images.githubusercontent.com/26234626/88642384-44aa8b80-d075-11ea-8362-40ec9edc6c1e.png)

2. Find the k3s ci task using classic pipelines or YAML pipelines.

    ![k3s task](https://user-images.githubusercontent.com/26234626/88642394-483e1280-d075-11ea-90a4-83a26859d306.png)

## How to use 
Add the k3s Task to your CI/CD in Azure DevOps Pipelines. Depending on the agent you choose the task will spinup a cluster in linux or windows.

## References
- [k3s CI Github Action](https://github.com/KnicKnic/temp-kubernetes-ci)
