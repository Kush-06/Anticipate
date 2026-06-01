import {
  Briefcase,
  Key,
  Home,
  Users,
  Baby,
  TrendingUp,
  Car,
  TrendingDown,
  Gift,
  Compass,
  CreditCard,
  BarChart2,
  Landmark,
  BookOpen
} from "lucide-react";

interface TopicIconProps {
  topicId: string;
  size?: number;
  className?: string;
  color?: string;
}

export function TopicIcon({ topicId, size = 24, className, color }: TopicIconProps) {
  const props = { size, className, color };
  switch (topicId) {
    case "starting-work":
      return <Briefcase {...props} />;
    case "renting":
      return <Key {...props} />;
    case "buying-a-home":
      return <Home {...props} />;
    case "relationships":
      return <Users {...props} />;
    case "family":
      return <Baby {...props} />;
    case "career":
      return <TrendingUp {...props} />;
    case "cars":
      return <Car {...props} />;
    case "debt":
      return <TrendingDown {...props} />;
    case "windfalls":
      return <Gift {...props} />;
    case "foundations":
      return <Compass {...props} />;
    case "mastering-credit":
      return <CreditCard {...props} />;
    case "investing-101":
      return <BarChart2 {...props} />;
    case "taxes-wealth":
      return <Landmark {...props} />;
    default:
      return <BookOpen {...props} />;
  }
}
