'use client';

import { useState, useEffect } from 'react';
import { Book, BookFormData } from '@/lib/types';
import { UI } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BookFormProps {
  book?: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BookFormData) => void;
}

const DEFAULT_FORM_DATA: BookFormData = {
  title: '',
  author: '',
  description: '',
  publishedYear: new Date().getFullYear(),
};

export function BookForm({ book, open, onOpenChange, onSubmit }: BookFormProps) {
  const isEditing = !!book;
  const [formData, setFormData] = useState<BookFormData>(DEFAULT_FORM_DATA);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        description: book.description,
        publishedYear: book.publishedYear,
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [book, open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'publishedYear' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Book' : 'Add New Book'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the book information below.'
              : 'Fill in the details to add a new book.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              required
              maxLength={UI.MAX_TITLE_LENGTH}
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter book title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">
              Author <span className="text-destructive">*</span>
            </Label>
            <Input
              id="author"
              name="author"
              required
              maxLength={UI.MAX_AUTHOR_LENGTH}
              value={formData.author}
              onChange={handleChange}
              placeholder="Enter author name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishedYear">Published Year</Label>
            <Input
              id="publishedYear"
              name="publishedYear"
              type="number"
              value={formData.publishedYear}
              onChange={handleChange}
              min="1000"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={UI.MAX_DESCRIPTION_LENGTH}
              rows={3}
              placeholder="Enter book description"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
