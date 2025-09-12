"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Taxi } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1 seat.").max(50, "Capacity cannot exceed 50 seats."),
});

export type TaxiFormValues = z.infer<typeof formSchema>;

interface TaxiFormProps {
  taxi?: Taxi;
  onSubmit: (data: TaxiFormValues) => void;
  onClose: () => void;
}

export function TaxiForm({ taxi, onSubmit, onClose }: TaxiFormProps) {
  const form = useForm<TaxiFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: taxi?.name || "",
      capacity: taxi?.capacity || 4,
    },
  });

  const handleSubmit = (data: TaxiFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taxi Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., City Cruiser" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seat Capacity</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{taxi ? "Save Changes" : "Add Taxi"}</Button>
        </div>
      </form>
    </Form>
  );
}
