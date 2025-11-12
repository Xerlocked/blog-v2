---
title: SilvervineUE4Lua - 0x01
published: 2024-12-16
description: 'SilvervineUE4Lua - uplugin 파일 분석'
tags: [uplugin]
category: 'UnrealEngine'
draft: false 
---

# 들어가며
모든 언리얼 플러그인은 .uplugin 파일을 가지고 있습니다.

이는 플러그인 디스크럽터라고 불리는데, 플러그인의 명세서 같은 것 입니다.

엔진 혹은 프로젝트를 실행할 때, Plugin 폴더의 .uplugin 파일을 찾고 그 내용을 읽어서 로드합니다.

그러면 이제 `SilvervineUE4Lua`(이하 실버바인)을 UE5 버전으로 포팅하기 위한 첫번째 단계로 `.uplugin` 파일을 살펴보겠습니다.

기존의 프로젝트는 다음 링크를 참고 해주세요.
[SilvervineUE4Lua](https://github.com/devcat-studio/SilvervineUE4Lua)

# 1. UPLUGIN
``` json
{
  "FileVersion": 3,
  "Version": 1,
  "VersionName": "0.1.5",
  "FriendlyName": "Silvervine Lua Script Plugin for UE4",
  "Description": "",
  "Category": "Scripting",
  "CreatedBy": "ProjectDH, devCAT, NEXON",
  "CreatedByURL": "https://devcat.com",
  "DocsURL": "",
  "MarketplaceURL": "",
  "SupportURL": "",
  "EnabledByDefault": false,
  "CanContainContent": false,
  "IsBetaVersion": false,
  "Installed": false,
  "CanBeUsedWithUnrealHeaderTool" : true,

  "Modules": [
    {
      "Name": "SilvervineUE4Lua",
      "Type": "Runtime",
      "LoadingPhase": "PreDefault"
    },
    {
      "Name": "SilvervineUE4LuaEditor",
      "Type": "Editor",
      "LoadingPhase": "Default"
    },
    {
      "Name" : "SilvervineUE4LuaCodeGen",
      "Type" : "Program",
      "LoadingPhase" : "PostConfigInit"
    }
  ]
}
```

.uplugin 파일은 JSON 형식을 띄고 있으며 크게 두 구역으로 나눌 수 있습니다.

파일 포맷 영역, 모듈 스크립터 영역으로 구분할 수 있습니다.
먼저 파일 포맷 영역을 보겠습니다.

# 2. 파일 포맷 영역

``` json
{
  "FileVersion": 3,
  "Version": 1,
  "VersionName": "0.1.5",
  "FriendlyName": "Silvervine Lua Script Plugin for UE4",
  "Description": "",
  "Category": "Scripting",
  "CreatedBy": "ProjectDH, devCAT, NEXON",
  "CreatedByURL": "https://devcat.com",
  "DocsURL": "",
  "MarketplaceURL": "",
  "SupportURL": "",
  "EnabledByDefault": false,
  "CanContainContent": false,
  "IsBetaVersion": false,
  "Installed": false,
  "CanBeUsedWithUnrealHeaderTool" : true,
}
```

파일 포맷의 키 값은 다음 API 레퍼런스를 따릅니다.
[FPluginDescriptor](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/API/Runtime/Projects/FPluginDescriptor?application_version=5.0)

아마 마지막 5개의 키 값을 제외하곤 어떤 값을 입력해야 할 지 알아보실 수 있을 겁니다. 그러면 5개만 빠르게 설명하겠습니다.

## EnabledByDefault

- 플러그인의 활성화 여부
- `true` : 모든 프로젝트에서 이 플러그인은 기본적으로 활성화됩니다.
- `false` : 기본적으로 비활성화 됩니다.

## CanContainContent

- 플러그인에 콘텐츠(에셋, 사운드, 이미지 등)을 포함할 지 여부
- `true` : 플러그인에 콘텐츠가 포함될 수 있습니다.
- `false` : 플러그인에 콘텐츠가 포함될 수 없습니다. (코드만 가능)

## IsBetaVersion

- 플러그인의 베타 버전 표시 여부
- `true` : 플러그인이 베타 버전임을 나타냅니다.
- `false` : 플러그인이 베타 버전이 아님을 나타냅니다.

## Installed

- 플러그인이 엔진 위에 설치되었는지 여부
- `true` : 플러그인이 설치되어 있습니다.
- `false` : 플러그인이 설치되어 있지 않습니다.

## CanBeUsedWithUnrealHeaderTool

- 플러그인의 C++ 코드가 UHT 에 의해 처리될 수 있는지 여부
- `true` : C++ 코드가 UHT에 의해 처리될 수 있습니다.
- `false` : C++ 코드가 UHT에 의해 처리되지 않습니다.

# 3. 모듈 스크립터 영역

``` json
{
"Modules": [
    {
      "Name": "SilvervineUE4Lua",
      "Type": "Runtime",
      "LoadingPhase": "PreDefault"
    },
    {
      "Name": "SilvervineUE4LuaEditor",
      "Type": "Editor",
      "LoadingPhase": "Default"
    },
    {
      "Name" : "SilvervineUE4LuaCodeGen",
      "Type" : "Program",
      "LoadingPhase" : "PostConfigInit"
    }
  ]
}
```

모듈 스크립터에 대한 것은 다음 링크에서 확인하실 수 있습니다.
[FModuleDescriptor](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/API/Runtime/Projects/FModuleDescriptor?application_version=5.0)

실버바인 플러그인의 모듈은 크게 세 가지로 나눌 수 있습니다. `Lua`, `LuaEditor`, `LuaCodeGen` 입니다.

이들 각각의 기능을 살펴보면 다음과 같습니다.

- `Lua`: 메인 모듈로, Lua 스크립팅 언어를 엔진에서 사용할 수 있도록 합니다.
- `LuaEditor`: LuaVM 에셋을 에디터 상에서 uasset 파일로 생성할 수 있는 기능을 제공합니다.
- `LuaCodeGen`: Lua 코드를 C++ 코드로 변환하여 처리하는 모듈입니다.

이제 각 모듈의 설정에 대해 살펴 보겠습니다.

## SilvervineUE4Lua

- Type: `Runtime`
    - 프로그램을 제외한 모든 대상에 로드되는 모듈입니다.
- LoadingPhase: `PreDefault`
    - Default 페이즈 전에 실행됩니다.
    - Defalut 페이즈는 엔진 초기화 중, 게임 모듈 로드 후 입니다.

## SilvervineUE4LuaEditor

- Type: `Editor`
    - 에디터가 시작할 때만 로드되는 모듈입니다.
- LoadingPhase: `Defulat`
    - Default 페이즈에 실행됩니다.

## SilvervineUE4LuaCodeGen

- Type: `Program`
    - 독립 실행형 프로그램에서만 로드됩니다.
    - 에디터나 게임 런타임에서는 로드되지 않습니다.
- LoadingPhase: `PostConfigInit`
    - 엔진이 완전히 초기화되기 전, 구성 시스템이 초기화된 직후 로드됩니다.

포팅을 하기 위한 첫 발걸음으로 .uplugin 파일을 살펴보았습니다.

앞으로 갈 길이 멀어보이지만 하나씩 하다보면 완성할 수 있겠죠? 열심히 해보겠습니다.