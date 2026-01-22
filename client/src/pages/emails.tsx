import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckSquare, Users, FileText, Bell, AlertCircle, X, Download, Eye, ExternalLink, User, Clock, Reply, Copy, Loader2 } from "lucide-react";
import type { ClassificationStats, Email } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClassificationStats {
  total: number;
  task: number;
  meeting: number;
  approval: number;
  notice: number;
  unclassified: number;
}

interface DraftReplyResponse {
  draft: string;
  emailId: number;
  originalSubject: string;
}

interface UserProfile {
  email: string;
  shipNumbers: string;
}

type ClassificationType = "all" | "task" | "meeting" | "approval" | "notice" | "unclassified";

export default function EmailsPage() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ClassificationType>("all");
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; path: string } | null>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [draftEmailId, setDraftEmailId] = useState<number | null>(null);
  const [draftReply, setDraftReply] = useState<string>("");
  const [filterMyEmails, setFilterMyEmails] = useState(false);
  const [filterMyShips, setFilterMyShips] = useState(false);

  const { data: classificationStats } = useQuery<ClassificationStats>({
    queryKey: ["/api/emails/classification-stats"],
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/settings/profile"],
  });

  const draftMutation = useMutation({
    mutationFn: async (emailId: number) => {
      const response = await apiRequest("POST", "/api/ai/draft-reply", { emailId });
      return response.json() as Promise<DraftReplyResponse>;
    },
    onSuccess: (data) => {
      setDraftReply(data.draft);
      toast({
        title: "회신 초안 생성 완료",
        description: "회신 초안이 생성되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message || "회신 초안 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const { data: emails, isLoading: emailsLoading } = useQuery<Email[]>({
    queryKey: ["/api/emails", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/emails" 
        : `/api/emails?classification=${selectedCategory}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch emails");
      return response.json();
    },
  });

  const selectedEmail = emails?.find(e => e.id === selectedEmailId);

  // 이메일 필터링 로직
  let filteredEmails = emails || [];
  
  if (userProfile) {
    // "나에게 온 메일" 필터
    if (filterMyEmails && userProfile.email) {
      filteredEmails = filteredEmails.filter(email => 
        email.sender.toLowerCase().includes(userProfile.email.toLowerCase())
      );
    }
    
    // "담당 호선" 필터
    if (filterMyShips && userProfile.shipNumbers) {
      const shipNumbers = userProfile.shipNumbers
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      filteredEmails = filteredEmails.filter(email => {
        const emailText = `${email.subject} ${email.body}`.toLowerCase();
        return shipNumbers.some(ship => emailText.includes(ship.toLowerCase()));
      });
    }
  }

  const categoryLabels = {
    all: "전체",
    task: "업무",
    meeting: "회의",
    approval: "결재",
    notice: "공지",
    unclassified: "미분류",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-3 shadow-lg">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">이메일 분류</h1>
              <p className="text-sm text-muted-foreground mt-0.5">받은 이메일 분류 현황</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">전체 이메일 목록</CardTitle>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="filter-my-emails" 
                    checked={filterMyEmails}
                    onCheckedChange={setFilterMyEmails}
                  />
                  <Label htmlFor="filter-my-emails" className="cursor-pointer">
                    나에게 온 메일
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="filter-my-ships" 
                    checked={filterMyShips}
                    onCheckedChange={setFilterMyShips}
                  />
                  <Label htmlFor="filter-my-ships" className="cursor-pointer">
                    담당 호선
                  </Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {classificationStats && classificationStats.total > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedEmailId(null);
                  }}
                  className="flex flex-col items-center justify-center gap-2 h-auto py-4 hover:shadow-md transition-all"
                >
                  <span className="text-sm font-semibold">{categoryLabels.all}</span>
                  <span className="text-2xl font-bold">{classificationStats.total}</span>
                </Button>
                <Button
                  variant={selectedCategory === "task" ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory("task");
                    setSelectedEmailId(null);
                  }}
                  className="flex flex-col items-center justify-center gap-2 h-auto py-4 hover:shadow-md transition-all"
                >
                  <CheckSquare className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-semibold">{categoryLabels.task}</span>
                  <span className="text-2xl font-bold">{classificationStats.task}</span>
                </Button>
                <Button
                  variant={selectedCategory === "meeting" ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory("meeting");
                    setSelectedEmailId(null);
                  }}
                  className="flex flex-col items-center justify-center gap-2 h-auto py-4 hover:shadow-md transition-all"
                >
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-semibold">{categoryLabels.meeting}</span>
                  <span className="text-2xl font-bold">{classificationStats.meeting}</span>
                </Button>
                <Button
                  variant={selectedCategory === "approval" ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory("approval");
                    setSelectedEmailId(null);
                  }}
                  className="flex flex-col items-center justify-center gap-2 h-auto py-4 hover:shadow-md transition-all"
                >
                  <FileText className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-semibold">{categoryLabels.approval}</span>
                  <span className="text-2xl font-bold">{classificationStats.approval}</span>
                </Button>
                <Button
                  variant={selectedCategory === "notice" ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory("notice");
                    setSelectedEmailId(null);
                  }}
                  className="flex flex-col items-center justify-center gap-2 h-auto py-4 hover:shadow-md transition-all"
                >
                  <Bell className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-semibold">{categoryLabels.notice}</span>
                  <span className="text-2xl font-bold">{classificationStats.notice}</span>
                </Button>
                <Button
                  variant={selectedCategory === "unclassified" ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory("unclassified");
                    setSelectedEmailId(null);
                  }}
                  className="flex flex-col items-center justify-center gap-2 h-auto py-4 hover:shadow-md transition-all"
                >
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-semibold">{categoryLabels.unclassified}</span>
                  <span className="text-2xl font-bold">{classificationStats.unclassified}</span>
                </Button>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="rounded-full bg-muted p-6 mx-auto w-fit mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">분류된 이메일이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              {categoryLabels[selectedCategory]} 이메일 목록
              {filteredEmails.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredEmails.length}개
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emailsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-16">
                <div className="rounded-full bg-muted p-6 mx-auto w-fit mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">{categoryLabels[selectedCategory]} 이메일이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmails.map(email => (
                  <div key={email.id}>
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedEmailId === email.id
                          ? 'bg-muted/50 border-primary shadow-md'
                          : 'hover:bg-muted/30 hover:border-muted-foreground/20'
                      }`}
                      onClick={() => setSelectedEmailId(selectedEmailId === email.id ? null : email.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold truncate">{email.subject || "제목 없음"}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {email.sender || "-"}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {email.date || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedEmailId === email.id && (
                      <div className="border-2 border-t-0 border-primary rounded-b-lg bg-muted/20 p-5">
                        <div className="relative">
                          <ScrollArea className="h-96 border-2 rounded-lg p-4 bg-background shadow-inner">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{email.body || "본문 없음"}</p>
                          </ScrollArea>
                          <div className="mt-4 flex justify-end gap-2">
                            <Button
                              size="lg"
                              variant="outline"
                              onClick={() => {
                                setDraftEmailId(email.id);
                                setDraftReply("");
                                setShowDraftDialog(true);
                              }}
                              className="gap-2"
                            >
                              <Reply className="h-5 w-5" />
                              회신 초안 생성
                            </Button>
                            {email.attachments && email.attachments.length > 0 && (
                              <Button
                                size="lg"
                                onClick={() => {
                                  const pdfAttachment = email.attachments?.find(att => 
                                    att.originalName?.toLowerCase().endsWith('.pdf')
                                  );
                                  if (pdfAttachment) {
                                    setPreviewFile({ 
                                      name: pdfAttachment.originalName, 
                                      path: pdfAttachment.relPath 
                                    });
                                  } else {
                                    alert('이 이메일에는 PDF 첨부파일이 없습니다.');
                                  }
                                }}
                                className="gap-2"
                              >
                                <FileText className="h-5 w-5" />
                                첨부파일 ({email.attachments.length})
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-6xl h-[95vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-muted/10">
            {previewFile && (
              <iframe
                src={`/api/attachments/${previewFile.path}`}
                className="w-full h-[calc(95vh-70px)] border-0"
                title={previewFile.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5" />
              회신 초안 생성
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <Button 
              onClick={() => {
                if (draftEmailId) {
                  setDraftReply("");
                  draftMutation.mutate(draftEmailId);
                }
              }}
              disabled={!draftEmailId || draftMutation.isPending}
            >
              {draftMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Reply className="h-4 w-4 mr-2" />
                  초안 생성
                </>
              )}
            </Button>

            {draftReply && (
              <div className="flex-1 overflow-hidden flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">생성된 회신 초안</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(draftReply);
                      toast({
                        title: "복사됨",
                        description: "회신 초안이 클립보드에 복사되었습니다.",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    복사
                  </Button>
                </div>
                <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap">{draftReply}</p>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
