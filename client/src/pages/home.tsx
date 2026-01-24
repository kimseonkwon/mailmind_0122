import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Calendar as CalendarIcon,
  Clock, 
  Ship,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Email, CalendarEvent, UserProfile } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface EmailStats {
  total: number;
  needsReply: number;
  thisWeekMeetings: number;
  shipEvents: number;
}

interface EmailStats {
  total: number;
  needsReply: number;
  thisWeekMeetings: number;
  shipEvents: number;
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
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: emails, isLoading: emailsLoading } = useQuery<Email[]>({
    queryKey: ["/api/emails"],
  });

  const { data: events, isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/events"],
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/settings/profile"],
  });

  // 통계 계산
  const stats = useMemo<EmailStats>(() => {
    if (!emails || !events || !userProfile) {
      return { total: 0, needsReply: 0, thisWeekMeetings: 0, shipEvents: 0 };
    }

    const userEmail = userProfile.email?.toLowerCase();
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // 회신 대기: 나에게 온 메일 중 회신이 필요한 메일
    const needsReply = emails.filter(email => 
      email.recipient?.toLowerCase().includes(userEmail) &&
      (email.classification === 'task' || email.classification === 'approval')
    ).length;

    // 금주 회의: 이번 주의 회의 일정
    const thisWeekMeetings = events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= startOfWeek && eventDate < endOfWeek &&
        event.title.toLowerCase().includes('회의');
    }).length;

    // 선박 이벤트: 호선 번호가 있는 일정
    const shipEvents = events.filter(event => event.shipNumber).length;

    return {
      total: emails.length,
      needsReply,
      thisWeekMeetings,
      shipEvents
    };
  }, [emails, events, userProfile]);

  // 캘린더 렌더링을 위한 날짜 계산
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];
    
    // 이전 달의 빈 칸
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentDate]);

  // 특정 날짜의 일정 가져오기
  const getEventsForDate = (day: number) => {
    if (!events) return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    
    return events.filter(event => {
      const eventDate = event.startDate.split(' ')[0];
      return eventDate === dateStr;
    });
  };

  // 이번 주 일정
  const thisWeekEvents = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return events
      .filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= startOfWeek && eventDate < endOfWeek;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  }, [events]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">홈</h1>
              <p className="text-xs text-muted-foreground">대시보드</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="전체 메일"
            value={stats.total}
            description="저장된 이메일 수"
            icon={Mail}
            loading={emailsLoading}
          />
          <StatCard
            title="회신 대기"
            value={stats.needsReply}
            description="답변이 필요한 메일"
            icon={Clock}
            loading={emailsLoading}
          />
          <StatCard
            title="금주 회의"
            value={stats.thisWeekMeetings}
            description="이번 주 회의 일정"
            icon={CalendarIcon}
            loading={eventsLoading}
          />
          <StatCard
            title="선박 이벤트"
            value={stats.shipEvents}
            description="호선별 일정"
            icon={Ship}
            loading={eventsLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 캘린더 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>캘린더</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-semibold min-w-[120px] text-center">
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                  </div>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                      <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                      const dayEvents = day ? getEventsForDate(day) : [];
                      return (
                        <div
                          key={index}
                          className={`min-h-[80px] p-2 border rounded-lg ${
                            day === null ? 'bg-muted/30' : 'bg-background hover:bg-muted/50'
                          } ${isToday(day || 0) ? 'border-primary border-2' : ''}`}
                        >
                          {day !== null && (
                            <>
                              <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary' : ''}`}>
                                {day}
                              </div>
                              <div className="space-y-1">
                                {dayEvents.slice(0, 2).map((event, i) => (
                                  <div
                                    key={i}
                                    className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                                    title={event.title}
                                  >
                                    {event.title}
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{dayEvents.length - 2}개
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 이번 주 일정 */}
          <Card>
            <CardHeader>
              <CardTitle>이번 주 일정</CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : thisWeekEvents.length > 0 ? (
                <div className="space-y-3">
                  {thisWeekEvents.map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{event.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.startDate).toLocaleDateString('ko-KR', { 
                              month: 'short', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </p>
                          {event.shipNumber && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {event.shipNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">이번 주 일정이 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
