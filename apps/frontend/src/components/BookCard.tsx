'use client';

import { Book } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateString: string): string {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return 'N/A';
  }
  return new Date(dateString).toLocaleDateString();
}

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{book.title}</CardTitle>
            <CardDescription className="mt-1">{book.author}</CardDescription>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(book)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(book.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {book.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {book.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {book.publishedYear > 0 && (
            <Badge variant="secondary">{book.publishedYear}</Badge>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(book.updatedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
