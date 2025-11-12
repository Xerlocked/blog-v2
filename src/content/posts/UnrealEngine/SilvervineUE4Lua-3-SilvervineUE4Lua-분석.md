---
title: SilvervineUE4Lua - 0x03
published: 2024-12-18
description: 'SilvervineUE4Lua - SilvervineUE4Lua 분석'
tags: [uplugin]
category: 'UnrealEngine'
draft: false 
---


# 들어가며
실버 바인의 3가지 모듈 중 다음으로 알아볼 것은 SilvervineUE4Lua입니다.

CodeGen 자체는 결국 코드를 만들어 내는 플러그인이라서 마지막으로 알아보도록 하고

오늘부터 차근차근 SUE4Lua에 대해 살펴보도록 하겠습니다.

# 1. Build.cs

역시나 먼저 Build.cs를 살펴봅니다.

``` cpp
using System.IO;
using UnrealBuildTool;

namespace UnrealBuildTool.Rules
{
    public class SilvervineUE4Lua : ModuleRules
    {
        public SilvervineUE4Lua(ReadOnlyTargetRules Target) : base(Target)
        {
            PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
            PrivatePCHHeaderFile = "SilvervineUE4LuaPCH.h";

            PublicIncludePaths.AddRange(new string[]
            {
            });

            PrivateIncludePaths.AddRange(new string[]
            {
                "SilvervineUE4Lua/Public",
                "SilvervineUE4Lua/ThirdParty/Lua/5.3.4/src",
            });

            PublicDependencyModuleNames.AddRange(new string[]
            {
                "Core",
                "CoreUObject",
                "Engine",
            });

            PrivateDependencyModuleNames.AddRange(new string[]
            {
                "InputCore",
                "SlateCore",
                "Slate",
                "UMG",
                "GameplayTags", // For StaticBinding
                "MovieScene",   // For StaticBinding
            });

            if (Target.bBuildEditor)
            {
                PrivateDependencyModuleNames.Add("DirectoryWatcher");
            }

            // 4.20 build error workaround
            PrivateDefinitions.Add("WIN32_LEAN_AND_MEAN");
            PrivateDefinitions.Add("__STDC_WANT_SECURE_LIB__");
        }
    }
}
```

- PCH 파일을 설정합니다. 역시 따로 작성된 헤더파일 목록은 없습니다.

- IncludePath를 설정합니다. 이 플러그인은 자체적으로 `Lua 5.3.4` 버전을 포함하고 있습니다.

- 의존 모듈로 `GameplayTaags`, `MovieScene` 을 포함합니다.

- 에디터 빌드인지 확인 후, 맞는다면 `DirectoryWatcher` 모듈을 추가합니다.

- 4.20 버전에서 빌드 오류를 해결하기 위해 추가 정의를 하고 있습니다.

    - `WIN32_LEAN_AND_MEAN` : Windows 헤더에서 불필요한 내용을 생략합니다.

    - `__STDC_WANT_SECURE_LIB__` : C 표준 라이브러리의 보안 기능을 사용합니다.


# 2. SilvervineUE4Lua.h

다음으로 SUE4Lua 모듈 정의 코드를 살펴보겠습니다. 먼저 헤더파일 부분입니다.

``` cpp
// SilvervineUE4Lua / devCAT studio
// Copyright 2016 - 2020. Nexon Korea Corporation. All rights reserved.

#pragma once

#include "Modules/ModuleInterface.h"

#include "LuaFileLoader.h"

//
// SUE4Lua 모듈 정의
//
class SILVERVINEUE4LUA_API FSilvervineUE4LuaModule : public IModuleInterface
{
    /** IModuleInterface implementation */
    virtual void StartupModule() override;
    virtual void ShutdownModule() override;

public:
    static FSilvervineUE4LuaModule& Get();

    DECLARE_MULTICAST_DELEGATE_OneParam(FFileModifiedDelegate, const FString& /*Filename*/);

public:
    // 설정되어 있는 파일 로더를 반환. 
    // 기본값은 내부에서 생성한 null 로더 인스턴스. 이 로더는 아무 동작도 하지 않고 경고 메시지만 출력합니다.
    FSUE4LuaFileLoader& GetFileLoader() const;

    // 파일 로더를 설정합니다.
    // null 객체를 전달하면 기본값(null 로더 인스턴스)으로 설정된다.
    // 반환값은 이전에 설정된 파일 로더.
    TSharedPtr<FSUE4LuaFileLoader> SetFileLoader(TSharedPtr<FSUE4LuaFileLoader> NewFileLoader);

    // 파일이 수정되었을 때 발생하는 이벤트
    FFileModifiedDelegate FileModifiedDelegate;
    
private:
    // 현재 설정된 파일 로더
    TSharedPtr<FSUE4LuaFileLoader> FileLoader;
};
```

- 기본적으로 `LuaFileLoader`를 통해서 lua 파일을 액세스 합니다.

- `FileLoader`의 `Get`, `Set` 함수를 설정합니다.

- Set 함수는 null 객체가 전달 되면 기본 값으로 자동 설정됩니다.

- 파일 수정에 대한 이벤트가 설정되어 있습니다.


# 3. SilvervineUE4Lua.cpp

다음으로 CPP 파일을 살펴보겠습니다.

``` cpp
// SilvervineUE4Lua / devCAT studio
// Copyright 2016 - 2020. Nexon Korea Corporation. All rights reserved.

#include "SilvervineUE4Lua.h"
#include "SilvervineUE4LuaSettings.h"

#include "Modules/ModuleManager.h"

#include "LuaBindingRegistry.h"
#include "LuaLog.h"
#include "LuaNativeValue.h"

#include "SilvervineUE4LuaCodeGen_Engine.g.inl"


DEFINE_LOG_CATEGORY(LogSUE4L);

// 경고만 출력하는 null lua 파일 로더
class FSUE4LuaNullFileLoader : public FSUE4LuaFileLoader
{
public:
    virtual bool LoadFileToString(FString& Result, const TCHAR* Filename) override
    {
        UE_LOG(LogSUE4L, Warning, TEXT("Accessing to Null File Loader. Check that SetFileLoader() calls is valid. [%s]"), __SUE4LUA_FUNCTION__);

        return false;
    }
    virtual FString GetLocalFilePath(const TCHAR* Filename) override
    {
        UE_LOG(LogSUE4L, Warning, TEXT("Accessing to Null File Loader. Check that SetFileLoader() calls is valid. [%s]"), __SUE4LUA_FUNCTION__);
        return FString();
    }
    virtual TArray<FString> GetFilenames(const TCHAR* Filename) override
    {
        UE_LOG(LogSUE4L, Warning, TEXT("Accessing to Null File Loader. Check that SetFileLoader() calls is valid. [%s]"), __SUE4LUA_FUNCTION__);
        return TArray<FString>();	
    }
};

IMPLEMENT_MODULE(FSilvervineUE4LuaModule, SilvervineUE4Lua)

FSilvervineUE4LuaModule& FSilvervineUE4LuaModule::Get()
{
    return FModuleManager::GetModuleChecked<FSilvervineUE4LuaModule>("SilvervineUE4Lua");
}

void FSilvervineUE4LuaModule::StartupModule()
{
    USUE4LuaSettings::Get()->SetFileLoader();
    FSUE4LuaBindingRegistry::Get().SetStaticBindingEnabled(USUE4LuaSettings::Get()->bEnableStaticBinding);

    SUE4LUA_REGISTER_BINDINGS();
}

void FSilvervineUE4LuaModule::ShutdownModule()
{
    if (0 < FSUE4LuaNativeValue::GetInstanceCount())
    {
        UE_LOG(LogSUE4L, Warning, TEXT("%d remaining native values. [%s]"), FSUE4LuaNativeValue::GetInstanceCount(), __SUE4LUA_FUNCTION__);
    }
}

FSUE4LuaFileLoader& FSilvervineUE4LuaModule::GetFileLoader() const
{
    return *FileLoader;
}

TSharedPtr<FSUE4LuaFileLoader> FSilvervineUE4LuaModule::SetFileLoader(TSharedPtr<FSUE4LuaFileLoader> NewFileLoader)
{
    auto OldFileLoader = FileLoader;
    FileLoader = NewFileLoader;

    if (!FileLoader.IsValid())
    {
        FileLoader = TSharedPtr<FSUE4LuaNullFileLoader>(new FSUE4LuaNullFileLoader);
    }

    return OldFileLoader; 
}

```

- `StartupModule` 메서드에서 FileLoader를 설정합니다.

- `ShutdownModule` 메서드에서는 Lua로 생성한 `UObject` 인스턴스가 남아있는지 검사합니다.

- `SetFileLoader` 메서드는 이전의 파일 로더를 새 파일로더로 교체하고 만약 유효하지 않다면 `NullFileLoader`로 생성됩니다. 이전 파일 로더를 반환합니다.


# 마무리

- Build.cs 에서 Lua를 자체적으로 인크루드하고 있었습니다.

- SilvervineUE4Lua 에서는 lua 파일 액세스에 필요한 파일 로더를 설정합니다.

모듈의 시작인 SUE4Lua 파일은 파일 로더를 설정하는 기능만 들어가 있는 것을 알 수 있었습니다.