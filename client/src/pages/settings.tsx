import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon,
  Database,
  Folder,
  Server,
  HardDrive,
  Save,
  AlertCircle,
  CheckCircle,
  User,
  Mail
} from "lucide-react";

interface StorageSettings {
  mode: string;
  dataDir: string;
  savedMode: string;
  savedDataDir: string;
  info: string;
  needsRestart: boolean;
}

interface OllamaStatus {
  connected: boolean;
  baseUrl: string;
}

interface UserProfile {
  name?: string;
  email: string;
  department?: string;
  area?: string;
  equipment?: string;
  shipNumbers: string;
}

interface Stats {
  mode: string;
  emailsCount: number;
  lastImport: string | null;
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  loading 
}: { 
  title: string; 
  value: string | number; 
  description?: string;
  icon: typeof Mail;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">
            {value}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [storageMode, setStorageMode] = useState<string>("");
  const [dataDir, setDataDir] = useState<string>("");
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");
  const [shipNumbers, setShipNumbers] = useState<string>("");
  const [isProfileInitialized, setIsProfileInitialized] = useState(false);

  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/settings/profile"],
  });

  const { data: storageSettings, isLoading: storageLoading } = useQuery<StorageSettings>({
    queryKey: ["/api/settings/storage"],
  });

  const { data: ollamaStatus, isLoading: ollamaLoading } = useQuery<OllamaStatus>({
    queryKey: ["/api/ollama/status"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  useEffect(() => {
    if (storageSettings && !isFormInitialized) {
      setStorageMode(storageSettings.savedMode || storageSettings.mode || "postgresql");
      setDataDir(storageSettings.savedDataDir || storageSettings.dataDir || "");
      setIsFormInitialized(true);
    }
  }, [storageSettings, isFormInitialized]);

  useEffect(() => {
    if (userProfile && !isProfileInitialized) {
      setUserName(userProfile.name || "");
      setUserEmail(userProfile.email || "");
      setDepartment(userProfile.department || "");
      setArea(userProfile.area || "");
      setEquipment(userProfile.equipment || "");
      setShipNumbers(userProfile.shipNumbers || "");
      setIsProfileInitialized(true);
    }
  }, [userProfile, isProfileInitialized]);

  const saveStorageMutation = useMutation({
    mutationFn: async (data: { mode: string; dataDir: string }) => {
      return apiRequest("POST", "/api/settings/storage", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/storage"] });
      toast({
        title: "설정 저장됨",
        description: "변경 사항을 적용하려면 애플리케이션을 재시작하세요.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email: string; department?: string; area?: string; equipment?: string; shipNumbers: string }) => {
      return apiRequest("POST", "/api/settings/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/profile"] });
      toast({
        title: "프로필 저장 완료",
        description: "사용자 프로필이 저장되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (storageMode === "local" && !dataDir.trim()) {
      toast({
        title: "폴더 경로 필요",
        description: "로컬 저장소를 사용하려면 데이터 폴더 경로를 입력하세요.",
        variant: "destructive",
      });
      return;
    }

    saveStorageMutation.mutate({ mode: storageMode, dataDir: dataDir });
  };

  const handleSaveProfile = () => {
    if (!userEmail.trim()) {
      toast({
        title: "이메일 필요",
        description: "본인 메일주소를 입력하세요.",
        variant: "destructive",
      });
      return;
    }

    if (!shipNumbers.trim()) {
      toast({
        title: "호선 번호 필요",
        description: "담당 호선을 입력하세요.",
        variant: "destructive",
      });
      return;
    }

    saveProfileMutation.mutate({ 
      name: userName.trim() || undefined,
      email: userEmail, 
      department: department.trim() || undefined,
      area: area.trim() || undefined,
      equipment: equipment.trim() || undefined,
      shipNumbers: shipNumbers 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2">
              <SettingsIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">설정</h1>
              <p className="text-xs text-muted-foreground">저장소 및 AI 설정 관리</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <StatCard
            title="총 이메일"
            value={stats?.emailsCount.toLocaleString() ?? "0"}
            description="저장된 이메일 수"
            icon={Mail}
            loading={statsLoading}
          />
          <StatCard
            title="저장소 상태"
            value={stats?.mode ?? "확인 중..."}
            description="현재 저장 모드"
            icon={Database}
            loading={statsLoading}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              사용자 프로필
            </CardTitle>
            <CardDescription>
              메일 필터링 시 사용할 사용자 기준 정보를 설정합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {profileLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-sm font-medium">
                    이름
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="홍길동"
                    data-testid="input-user-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail" className="text-sm font-medium">
                    메일주소 *
                  </Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="director@shipyard.co.kr"
                    data-testid="input-user-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">
                    부서
                  </Label>
                  <Input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="생산관리팀"
                    data-testid="input-department"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area" className="text-sm font-medium">
                    담당 구역
                  </Label>
                  <Input
                    id="area"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="1공장"
                    data-testid="input-area"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment" className="text-sm font-medium">
                    장비
                  </Label>
                  <Input
                    id="equipment"
                    type="text"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="크레인, 용접기"
                    data-testid="input-equipment"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipNumbers" className="text-sm font-medium">
                    담당 호선(복수) *
                  </Label>
                  <Input
                    id="shipNumbers"
                    value={shipNumbers}
                    onChange={(e) => setShipNumbers(e.target.value)}
                    placeholder="H3200, H8151"
                    data-testid="input-ship-numbers"
                  />
                  <p className="text-xs text-muted-foreground">
                    담당 호선은 쉼표(,)로 구분해서 여러 개를 입력하세요. 예: H3200, H8151
                  </p>
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saveProfileMutation.isPending}
                  className="w-full"
                  data-testid="button-save-profile"
                >
                  {saveProfileMutation.isPending ? (
                    "저장 중..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      수정
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              저장소 설정
            </CardTitle>
            <CardDescription>
              이메일 데이터가 저장되는 위치를 설정합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {storageLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-md">
                  <span className="text-sm">현재 사용 중:</span>
                  <Badge variant={storageSettings?.mode === "local" ? "default" : "secondary"}>
                    {storageSettings?.mode === "local" ? (
                      <>
                        <HardDrive className="h-3 w-3 mr-1" />
                        로컬 SQLite
                      </>
                    ) : (
                      <>
                        <Database className="h-3 w-3 mr-1" />
                        PostgreSQL
                      </>
                    )}
                  </Badge>
                </div>

                {storageSettings?.needsRestart && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span>저장된 설정이 현재 설정과 다릅니다. 재시작이 필요합니다.</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">저장소 모드 선택</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={storageMode === "postgresql" ? "default" : "outline"}
                        className="h-auto p-4 justify-start"
                        onClick={() => setStorageMode("postgresql")}
                        data-testid="button-postgresql"
                      >
                        <Database className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">PostgreSQL</div>
                          <div className="text-xs opacity-70">클라우드 데이터베이스</div>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant={storageMode === "local" ? "default" : "outline"}
                        className="h-auto p-4 justify-start"
                        onClick={() => setStorageMode("local")}
                        data-testid="button-local"
                      >
                        <HardDrive className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">로컬 PC 폴더</div>
                          <div className="text-xs opacity-70">SQLite 파일로 저장</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {storageMode === "local" && (
                    <div className="space-y-2">
                      <Label htmlFor="dataDir" className="text-sm font-medium flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        데이터 폴더 경로
                      </Label>
                      <Input
                        id="dataDir"
                        value={dataDir}
                        onChange={(e) => setDataDir(e.target.value)}
                        placeholder="/home/user/email-data"
                        className="font-mono"
                        data-testid="input-data-dir"
                      />
                      <p className="text-xs text-muted-foreground">
                        예: /home/user/email-data 또는 C:\Users\user\email-data
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleSave} 
                    disabled={saveStorageMutation.isPending}
                    className="w-full"
                    data-testid="button-save-storage"
                  >
                    {saveStorageMutation.isPending ? (
                      "저장 중..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        설정 저장
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-md">
                    <p className="font-medium mb-1">참고사항:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>설정 변경 후 애플리케이션 재시작이 필요합니다</li>
                      <li>환경 변수로도 설정 가능: STORAGE_MODE, DATA_DIR</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              AI 서버 설정
            </CardTitle>
            <CardDescription>
              Ollama AI 서버 연결 상태를 확인합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ollamaLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">연결 상태</span>
                  <Badge variant={ollamaStatus?.connected ? "default" : "destructive"}>
                    {ollamaStatus?.connected ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        연결됨
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        연결 안됨
                      </>
                    )}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">서버 주소</span>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {ollamaStatus?.baseUrl || "http://localhost:11434"}
                  </span>
                </div>

                <div className="bg-muted/50 rounded-md p-4 text-sm">
                  <p className="font-medium mb-2">AI 기능</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>- 이메일 자동 분류 (업무, 개인, 회의 등)</li>
                    <li>- 일정 자동 추출 및 캘린더 연동</li>
                    <li>- AI 채팅 (이메일 내용 기반 답변)</li>
                  </ul>
                  {!ollamaStatus?.connected && (
                    <p className="mt-3 text-destructive">
                      AI 서버에 연결되지 않으면 자동 분류 및 일정 추출이 작동하지 않습니다.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI 학습 데이터</CardTitle>
            <CardDescription>
              업로드된 이메일 데이터가 AI 응답에 어떻게 사용되는지 설명합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                업로드된 모든 이메일 데이터는 AI 채팅 시 참고 자료로 활용됩니다.
              </p>
              <p>
                AI에게 질문하면, 관련된 이메일 내용을 자동으로 검색하여 
                맥락에 맞는 답변을 제공합니다.
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>이메일 내용 기반 질의응답</li>
                <li>일정 및 미팅 관련 정보 검색</li>
                <li>발신자/수신자 관련 정보 조회</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
