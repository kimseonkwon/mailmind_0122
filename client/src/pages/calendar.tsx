/* 이벤트가 있는 월로 자동으로 이동 하는 코드
useEffect(() => {
  if (!events || events.length === 0) return;

  const firstEventDate = new Date(events[0].startDate);
  setSelectedDate(firstEventDate);
}, [events]);
*/

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock,
  FileText,
  Mail,
  User,
  Loader2,
  Eye,
  CalendarDays
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CalendarEvent, Email } from "@shared/schema";

import Calendar from "react-calendar";

const EVENT_CATEGORIES = [
  { keyword: "회의", colorClass: "bg-blue-500 dark:bg-blue-600", dotColor: "bg-blue-500", label: "회의" },
  { keyword: "s/c", colorClass: "bg-violet-500 dark:bg-violet-600", dotColor: "bg-violet-500", label: "S/C(Steel Cutting)" },
  { keyword: "진수", colorClass: "bg-orange-500 dark:bg-orange-600", dotColor: "bg-orange-500", label: "L/C(LAUNCHING)" },
  { keyword: "시운전", colorClass: "bg-green-500 dark:bg-green-600", dotColor: "bg-green-500", label: "시운전" },
  { keyword: "가스시운전", colorClass: "bg-cyan-500 dark:bg-cyan-600", dotColor: "bg-cyan-500", label: "가스시운전" },
  { keyword: "인도", colorClass: "bg-yellow-500 dark:bg-yellow-600", dotColor: "bg-yellow-500", label: "D/L(DELIVERY)" },
  { keyword: "k/l", colorClass: "bg-red-500 dark:bg-red-600", dotColor: "bg-red-500", label: "K/L(Keel Laying)" },
] as const;

type EventCategory = typeof EVENT_CATEGORIES[number];

function getEventCategory(title: string): EventCategory {
  const t = title.toLowerCase();
  for (const cat of EVENT_CATEGORIES) {
    if (t.includes(cat.keyword)) return cat;
  }
  return EVENT_CATEGORIES[0];
}

function EventCard({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const category = getEventCategory(event.title);

  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer group" onClick={onClick} data-testid={`event-card-${event.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge 
                className={`text-xs px-3 py-1 text-white font-medium ${category.colorClass}`}
              >
                {category.label}
              </Badge>
              {event.shipNumber && (
                <Badge variant="outline" className="text-xs font-medium">
                  {event.shipNumber}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors" data-testid={`event-title-${event.id}`}>
              {event.title}
            </h3>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{event.startDate}</span>
                {event.endDate && <span>~ {event.endDate}</span>}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{event.location}</span>
                </span>
              )}
            </div>
            {event.description && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
          {event.emailId && (
            <Badge variant="outline" className="shrink-0 font-medium">
              <FileText className="h-3 w-3 mr-1" />
              #{event.emailId}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface UserProfile {
  email: string;
  shipNumbers: string;
}

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedShips, setSelectedShips] = useState<Set<string>>(new Set());
  const [filterMyShips, setFilterMyShips] = useState(false);

  const { data: events, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/events"],
  });

  const { data: ships } = useQuery<string[]>({
    queryKey: ["/api/events/ships"],
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/settings/profile"],
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    let filtered = events;

    // 카테고리 필터
    if (selectedCategories.size > 0) {
      filtered = filtered.filter(event => {
        const category = getEventCategory(event.title);
        return selectedCategories.has(category.keyword);
      });
    }

    // 호선 필터
    if (selectedShips.size > 0) {
      filtered = filtered.filter(event => {
        if (!event.shipNumber) return false;
        const eventShips = event.shipNumber.split(',').map(s => s.trim());
        return eventShips.some(ship => selectedShips.has(ship));
      });
    }

    // 담당 호선 필터
    if (filterMyShips && userProfile?.shipNumbers) {
      const myShips = userProfile.shipNumbers
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
      
      filtered = filtered.filter(event => {
        if (!event.shipNumber) return false;
        const eventShips = event.shipNumber.split(',').map(s => s.trim().toUpperCase());
        return eventShips.some(ship => 
          myShips.some(myShip => 
            ship === myShip || 
            ship.includes(myShip) || 
            myShip.includes(ship)
          )
        );
      });
    }

    return filtered;
  }, [events, selectedCategories, selectedShips, filterMyShips, userProfile]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    if (!filteredEvents) return map;

    for (const ev of filteredEvents) {
      if (!ev.startDate) continue;

      try {
        const dateOnly = new Date(ev.startDate)
          .toISOString()
          .slice(0, 10); // YYYY-MM-DD

        if (!map.has(dateOnly)) map.set(dateOnly, []);
        map.get(dateOnly)!.push(ev);
      } catch (error) {
        console.error('Invalid date for event:', ev.id, ev.startDate);
        continue;
      }
}

    return map;
  }, [filteredEvents]);

  const eventsForSelectedDate = eventsByDate.get(
    selectedDate.toISOString().split("T")[0]
  ) ?? [];

  const toggleCategory = (keyword: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };

  const toggleShip = (ship: string) => {
    setSelectedShips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ship)) {
        newSet.delete(ship);
      } else {
        newSet.add(ship);
      }
      return newSet;
    });
  };

  const { data: email, isLoading: isEmailLoading } = useQuery<Email>({
    queryKey: ["/api/emails", selectedEvent?.emailId],
    enabled: !!selectedEvent?.emailId,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-3 shadow-lg">
                <CalendarIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">일정</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  이메일에서 추출된 일정 목록 ({events?.length || 0}개)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch 
                  id="filter-my-ships-calendar" 
                  checked={filterMyShips}
                  onCheckedChange={setFilterMyShips}
                />
                <Label htmlFor="filter-my-ships-calendar" className="cursor-pointer text-sm font-medium">
                  담당 호선
                </Label>
              </div>
              <div className="h-6 w-px bg-border" />
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="default"
                onClick={() => setViewMode('list')}
                data-testid="button-view-list"
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                전체 목록
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="default"
                onClick={() => setViewMode('calendar')}
                data-testid="button-view-calendar"
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                달력 보기
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-lg mb-4">일정 범례</h3>
            <div className="flex flex-wrap gap-3">
              {EVENT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.has(cat.keyword);
                const isActive = selectedCategories.size === 0 || isSelected;
                
                return (
                  <button
                    key={cat.keyword}
                    onClick={() => toggleCategory(cat.keyword)}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-all ${
                      isActive 
                        ? 'opacity-100 ring-2 ring-offset-2' 
                        : 'opacity-30 hover:opacity-50'
                    }`}
                    style={{
                      ringColor: isActive ? cat.dotColor : 'transparent'
                    }}
                  >
                    <div className={`h-3 w-3 rounded-full ${cat.dotColor}`} />
                    <span className="font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedCategories.size > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setSelectedCategories(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  전체 범례 보기
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base">호선</h3>
                {selectedShips.size > 0 && (
                  <button
                    onClick={() => setSelectedShips(new Set())}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    전체 보기
                  </button>
                )}
              </div>
              {ships && ships.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ships.map((ship) => {
                    const isSelected = selectedShips.has(ship);
                    const isActive = selectedShips.size === 0 || isSelected;
                    
                    return (
                      <button
                        key={ship}
                        onClick={() => toggleShip(ship)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-background text-muted-foreground opacity-40 hover:opacity-70'
                        }`}
                      >
                        {ship}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  이메일에서 추출된 호선이 없습니다. 일정을 추가하면 자동으로 호선이 표시됩니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {viewMode === 'calendar' && (
          <Card className="overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="w-full">
                <Calendar
                  onChange={(value) => {
                    if (value instanceof Date) setSelectedDate(value);
                    else if (Array.isArray(value) && value[0] instanceof Date) {
                      setSelectedDate(value[0]);
                    }
                  }}
                  value={selectedDate}
                  formatDay={(locale, date) => date.getDate().toString()}
                  className="w-full border-0"
                  tileContent={({ date, view }) => {
                    if (view !== "month") return null;
                    const key = date.toISOString().split("T")[0];
                    const dayEvents = eventsByDate.get(key);
                    if (!dayEvents?.length) return null;

                    return (
                      <div className="mt-1 space-y-0.5 w-full px-0.5">
                        {dayEvents.map((ev, idx) => {
                          const category = getEventCategory(ev.title);
                          const truncatedTitle = ev.title.length > 12 ? ev.title.substring(0, 12) + '...' : ev.title;
                          return (
                            <div
                              key={ev.id}
                              className={`text-[10px] px-1 py-0.5 rounded text-white truncate ${category.colorClass}`}
                              style={{ lineHeight: '1.2' }}
                              title={ev.title}
                            >
                              {truncatedTitle}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                  tileClassName={({ date }) => {
                    const key = date.toISOString().split("T")[0];
                    const dayEvents = eventsByDate.get(key);
                    return dayEvents?.length ? 'min-h-[120px] align-top' : 'min-h-[80px]';
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !events?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">일정이 없습니다</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                이메일에서 일정을 추출해보세요.
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          <div className="space-y-4" data-testid="events-list">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">선택한 범례의 일정이 없습니다</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    다른 범례를 선택하거나 전체 보기를 선택하세요.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => setSelectedEvent(event)}
                />
              ))
            )}
          </div>
        ) : eventsForSelectedDate.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">선택한 날짜에 일정이 없습니다</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {eventsForSelectedDate.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}

        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              {selectedEvent && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge 
                      className={`text-xs px-2 py-0.5 text-white ${getEventCategory(selectedEvent.title).colorClass}`}
                    >
                      {getEventCategory(selectedEvent.title).label}
                    </Badge>
                    {selectedEvent.shipNumber && (
                      <Badge variant="outline" className="text-xs">
                        {selectedEvent.shipNumber}
                      </Badge>
                    )}
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">일정:</span>
                      <span>{selectedEvent.startDate}</span>
                      {selectedEvent.endDate && <span>~ {selectedEvent.endDate}</span>}
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">장소:</span>
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    {selectedEvent.description && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium">상세 내용:</span>
                          <p className="mt-1 text-muted-foreground">{selectedEvent.description}</p>
                        </div>
                      </div>
                    )}
                    
                    {!isEmailLoading && email && (
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium">메일 본문:</span>
                          <div className="mt-2 p-3 bg-muted rounded-md max-h-64 overflow-y-auto">
                            <p className="text-sm whitespace-pre-wrap">{email.body}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {isEmailLoading && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">원본 이메일 로딩 중...</span>
                      </div>
                    </div>
                  )}

                  {!isEmailLoading && email && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        원본 이메일
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium">제목:</span>
                          <p className="text-sm text-muted-foreground mt-1">{email.subject}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">발신자:</span>
                          <span className="text-muted-foreground">{email.sender}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">날짜:</span>
                          <span className="text-muted-foreground">{email.date}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">내용:</span>
                          <div className="mt-2 p-4 bg-muted rounded-md max-h-64 overflow-y-auto">
                            <p className="text-sm whitespace-pre-wrap">{email.body}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
