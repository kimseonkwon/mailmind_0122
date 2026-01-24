import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Mail, 
  Database, 
  Clock, 
  User, 
  FileText,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import type { Stats, ChatResponse, SearchResult, EventExtractionResponse } from "@shared/schema";
import { cn } from "@/lib/utils";

function EmailResultCard({ 
  result, 
  index,
  expanded,
  onToggle,
  onExtract,
  isExtracting
}: { 
  result: SearchResult; 
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onExtract: (emailId: number) => void;
  isExtracting: boolean;
}) {
  return (
    <Card 
      className="hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer group"
      onClick={onToggle}
      data-testid={`email-result-${index}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors" data-testid={`email-subject-${index}`}>
                {result.subject || "(제목 없음)"}
              </h3>
              <Badge variant="secondary" className="text-xs shrink-0 font-medium">
                점수: {result.score.toFixed(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              {result.sender && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">{result.sender}</span>
                </span>
              )}
              {result.date && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{result.date}</span>
                </span>
              )}
            </div>
            {!expanded && result.body && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {result.body}
              </p>
            )}
            {expanded && result.body && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.body}</p>
              </div>
            )}
            {expanded && result.attachments && result.attachments.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  첨부파일 ({result.attachments.length})
                </p>
                <div className="space-y-2">
                  {result.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm truncate font-medium">{att.originalName}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          ({(att.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      {att.originalName.toLowerCase().endsWith('.pdf') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/api/attachments/${att.relPath}`, '_blank');
                          }}
                        >
                          보기
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {expanded && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExtract(parseInt(result.mailId));
                  }}
                  disabled={isExtracting}
                  data-testid={`extract-events-${index}`}
                  className="gap-2"
                >
                  {isExtracting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  일정 추출
                </Button>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 group-hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            data-testid={`toggle-email-${index}`}
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Mail; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [topK, setTopK] = useState(10);
  const [expandedEmails, setExpandedEmails] = useState<Set<number>>(new Set());
  const [searchResults, setSearchResults] = useState<ChatResponse | null>(null);
  const [extractingEmails, setExtractingEmails] = useState<Set<number>>(new Set());
  const [filterSender, setFilterSender] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterBody, setFilterBody] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterOperator, setFilterOperator] = useState<"and" | "or">("and");
  const [startParts, setStartParts] = useState({ year: "", month: "", day: "" });
  const [endParts, setEndParts] = useState({ year: "", month: "", day: "" });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const extractMutation = useMutation({
    mutationFn: async (emailId: number) => {
      setExtractingEmails(prev => new Set(prev).add(emailId));
      const res = await apiRequest("POST", "/api/events/extract", { emailId });
      return res.json() as Promise<EventExtractionResponse>;
    },
    onSuccess: (data) => {
      setExtractingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.emailId);
        return newSet;
      });
      if (data.events.length > 0) {
        toast({
          title: "일정 추출 완료",
          description: `${data.events.length}개의 일정을 추출했습니다.`,
        });
      } else {
        toast({
          title: "일정 없음",
          description: "이 이메일에서 일정을 찾을 수 없습니다.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error, emailId: number) => {
      setExtractingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
      toast({
        title: "일정 추출 실패",
        description: error.message || "일정을 추출하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (data: { message: string; topK: number; filters?: any }) => {
      const res = await apiRequest("POST", "/api/search", data);
      return res.json() as Promise<ChatResponse>;
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setExpandedEmails(new Set());
    },
    onError: (error) => {
      toast({
        title: "검색 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hasActiveFilters = () => [filterSender, filterSubject, filterBody, filterStartDate, filterEndDate].some(v => v.trim().length > 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const hasFilters = hasActiveFilters();
    if (!searchQuery.trim() && !hasFilters) {
      toast({
        title: "검색어를 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate({ 
      message: searchQuery, 
      topK,
      filters: {
        sender: filterSender || undefined,
        subject: filterSubject || undefined,
        body: filterBody || undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        operator: filterOperator,
      }
    });
  };

  const toggleEmailExpand = (index: number) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const years = Array.from({ length: 16 }, (_, i) => (2020 + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString().padStart(2, "0"), label: `${i + 1}월` }));
  const getDays = (y: string, m: string) => {
    if (!y || !m) return Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
    const last = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
    return Array.from({ length: last }, (_, i) => (i + 1).toString().padStart(2, "0"));
  };

  const updateDate = (
    parts: { year: string; month: string; day: string },
    setParts: React.Dispatch<React.SetStateAction<{ year: string; month: string; day: string }>>,
    setFilterDate: React.Dispatch<React.SetStateAction<string>>,
    field: "year" | "month" | "day",
    value: string
  ) => {
    const next = { ...parts, [field]: value };
    setParts(next);
    if (next.year && next.month && next.day) {
      const iso = `${next.year}-${next.month}-${next.day}`;
      setFilterDate(iso);
    }
  };

  const clearStartDate = () => {
    setStartParts({ year: "", month: "", day: "" });
    setFilterStartDate("");
  };

  const clearEndDate = () => {
    setEndParts({ year: "", month: "", day: "" });
    setFilterEndDate("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-3 shadow-lg">
                <Search className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">이메일 검색</h1>
                <p className="text-sm text-muted-foreground mt-0.5">PST/JSON 이메일 검색 도구</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {stats && (
                <Badge variant="outline" className="gap-2 px-3 py-1.5 font-medium">
                  <Database className="h-4 w-4" />
                  {stats.emailsCount.toLocaleString()}개
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="mb-8 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="검색어를 입력하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 text-base border-2 focus:border-primary transition-colors"
                  data-testid="input-search"
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">상세검색</p>
                <div className="rounded-lg border-2 border-dashed p-4 space-y-4 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Input
                      placeholder="발신자"
                      value={filterSender}
                      onChange={(e) => setFilterSender(e.target.value)}
                      data-testid="filter-sender"
                    />
                    <Input
                      placeholder="제목"
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      data-testid="filter-subject"
                    />
                    <Input
                      placeholder="본문 내용"
                      value={filterBody}
                      onChange={(e) => setFilterBody(e.target.value)}
                      data-testid="filter-body"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("justify-start text-left font-normal", !filterStartDate && "text-muted-foreground")}
                          data-testid="filter-start-date"
                        >
                          {filterStartDate ? filterStartDate : "시작일 선택"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px]" align="start">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">시작일을 선택하세요</p>
                            <Button variant="ghost" size="sm" onClick={clearStartDate} data-testid="reset-start-date">
                              초기화
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Select
                              value={startParts.year}
                              onValueChange={(v) => updateDate(startParts, setStartParts, setFilterStartDate, "year", v)}
                            >
                              <SelectTrigger><SelectValue placeholder="년" /></SelectTrigger>
                              <SelectContent>
                                {years.map(y => <SelectItem key={y} value={y}>{y}년</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Select
                              value={startParts.month}
                              onValueChange={(v) => updateDate(startParts, setStartParts, setFilterStartDate, "month", v)}
                            >
                              <SelectTrigger><SelectValue placeholder="월" /></SelectTrigger>
                              <SelectContent>
                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Select
                              value={startParts.day}
                              onValueChange={(v) => updateDate(startParts, setStartParts, setFilterStartDate, "day", v)}
                            >
                              <SelectTrigger><SelectValue placeholder="일" /></SelectTrigger>
                              <SelectContent>
                                {getDays(startParts.year, startParts.month).map(d => <SelectItem key={d} value={d}>{`${parseInt(d,10)}일`}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("justify-start text-left font-normal", !filterEndDate && "text-muted-foreground")}
                          data-testid="filter-end-date"
                        >
                          {filterEndDate ? filterEndDate : "종료일 선택"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px]" align="start">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">종료일을 선택하세요</p>
                            <Button variant="ghost" size="sm" onClick={clearEndDate} data-testid="reset-end-date">
                              초기화
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Select
                              value={endParts.year}
                              onValueChange={(v) => updateDate(endParts, setEndParts, setFilterEndDate, "year", v)}
                            >
                              <SelectTrigger><SelectValue placeholder="년" /></SelectTrigger>
                              <SelectContent>
                                {years.map(y => <SelectItem key={y} value={y}>{y}년</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Select
                              value={endParts.month}
                              onValueChange={(v) => updateDate(endParts, setEndParts, setFilterEndDate, "month", v)}
                            >
                              <SelectTrigger><SelectValue placeholder="월" /></SelectTrigger>
                              <SelectContent>
                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Select
                              value={endParts.day}
                              onValueChange={(v) => updateDate(endParts, setEndParts, setFilterEndDate, "day", v)}
                            >
                              <SelectTrigger><SelectValue placeholder="일" /></SelectTrigger>
                              <SelectContent>
                                {getDays(endParts.year, endParts.month).map(d => <SelectItem key={d} value={d}>{`${parseInt(d,10)}일`}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Select value={filterOperator} onValueChange={(v: "and" | "or") => setFilterOperator(v)}>
                      <SelectTrigger data-testid="filter-operator">
                        <SelectValue placeholder="AND/OR" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">AND (모두 포함)</SelectItem>
                        <SelectItem value="or">OR (하나라도 포함)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <label htmlFor="topK" className="text-sm font-medium text-foreground whitespace-nowrap">
                    결과 수:
                  </label>
                  <Input
                    id="topK"
                    type="number"
                    min={1}
                    max={50}
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
                    className="w-24 h-10"
                    data-testid="input-topk"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg"
                  className="flex-1 h-12 text-base font-semibold gap-2 shadow-md hover:shadow-lg transition-all"
                  disabled={searchMutation.isPending || (!searchQuery.trim() && !hasActiveFilters())}
                  data-testid="button-search"
                >
                  {searchMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      검색 중...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      검색
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              검색 결과
            </h2>
            {searchResults && (
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-semibold" data-testid="results-count">
                {searchResults.citations.length}개 결과
              </Badge>
            )}
          </div>

          {searchMutation.isPending ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchResults ? (
            searchResults.citations.length > 0 ? (
              <div className="space-y-4" data-testid="search-results">
                {searchResults.citations.map((result, index) => (
                  <EmailResultCard
                    key={`${result.mailId}-${index}`}
                    result={result}
                    index={index}
                    expanded={expandedEmails.has(index)}
                    onToggle={() => toggleEmailExpand(index)}
                    onExtract={(emailId) => extractMutation.mutate(emailId)}
                    isExtracting={extractingEmails.has(parseInt(result.mailId))}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="검색 결과가 없습니다"
                description="다른 검색어로 다시 시도해보세요."
              />
            )
          ) : (
            <EmptyState
              icon={Search}
              title="이메일을 검색해보세요"
              description="검색어를 입력하면 저장된 이메일에서 관련 내용을 찾아드립니다."
            />
          )}
        </section>
      </main>
    </div>
  );
}
