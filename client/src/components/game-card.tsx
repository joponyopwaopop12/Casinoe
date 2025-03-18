import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  maxWin: string;
  tag?: string;
  tagColor?: string;
  gradientFrom: string;
  gradientTo: string;
}

export function GameCard({
  title,
  description,
  icon,
  href,
  maxWin,
  tag,
  tagColor = 'cyan',
  gradientFrom,
  gradientTo,
}: GameCardProps) {
  // Map color names to Tailwind classes
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500 text-cyan-50',
    purple: 'bg-purple-500 text-purple-50',
    green: 'bg-green-500 text-green-50',
    amber: 'bg-amber-500 text-amber-50',
    red: 'bg-red-500 text-red-50',
  };

  const tagColorClass = colorMap[tagColor] || colorMap.cyan;

  return (
    <Link href={href}>
      <Card className={`relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
        {tag && (
          <div className="absolute top-4 right-4">
            <Badge className={tagColorClass}>{tag}</Badge>
          </div>
        )}
        
        <CardContent className="p-6 min-h-[220px] flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center mb-3">
              {icon}
              <h3 className="text-xl font-bold ml-3">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <div className="text-xs text-muted-foreground">Max Win</div>
              <div className="text-lg font-semibold">{maxWin}</div>
            </div>
            <button className="p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}