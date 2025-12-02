"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { useAppData } from "@/contexts/app-data-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import type { TransactionFiltersState } from "./transactions-view"

interface TransactionFiltersProps {
  filters: TransactionFiltersState
  onFiltersChange: (filters: TransactionFiltersState) => void
}

export default function TransactionFilters({ filters, onFiltersChange }: TransactionFiltersProps) {
  const { transactions } = useAppData()
  const [searchTerm, setSearchTerm] = useState(filters.searchQuery)
  const debouncedSearch = useDebounce(searchTerm, 500)

  const categories = Array.from(new Set(transactions.map((t) => t.AccountRef?.name || "Uncategorized"))).filter(Boolean)
  const paymentTypes = Array.from(new Set(transactions.map((t) => t.PaymentType))).filter(Boolean)

  useEffect(() => {
    onFiltersChange({ ...filters, searchQuery: debouncedSearch })
  }, [debouncedSearch])

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handlePaymentTypeToggle = (type: string) => {
    const newPaymentTypes = filters.paymentTypes.includes(type)
      ? filters.paymentTypes.filter((p) => p !== type)
      : [...filters.paymentTypes, type]
    onFiltersChange({ ...filters, paymentTypes: newPaymentTypes })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      searchQuery: "",
      startDate: "",
      endDate: "",
      categories: [],
      paymentTypes: [],
      minAmount: null,
      maxAmount: null,
    })
    setSearchTerm("")
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.startDate ||
    filters.endDate ||
    filters.categories.length > 0 ||
    filters.paymentTypes.length > 0 ||
    filters.minAmount !== null ||
    filters.maxAmount !== null

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vendor, description, or account..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex gap-2 flex-wrap">
            {/* Date filters */}
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-muted-foreground">Date:</label>
              <input
                type="date"
                className="px-2 py-1 border rounded text-sm bg-background"
                value={filters.startDate}
                onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                className="px-2 py-1 border rounded text-sm bg-background"
                value={filters.endDate}
                onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
              />
            </div>

            {/* Amount range filters */}
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-muted-foreground">Amount:</label>
              <Input
                type="number"
                placeholder="Min"
                className="w-20 h-8 text-sm"
                value={filters.minAmount ?? ""}
                onChange={(e) =>
                  onFiltersChange({ ...filters, minAmount: e.target.value ? Number.parseFloat(e.target.value) : null })
                }
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="number"
                placeholder="Max"
                className="w-20 h-8 text-sm"
                value={filters.maxAmount ?? ""}
                onChange={(e) =>
                  onFiltersChange({ ...filters, maxAmount: e.target.value ? Number.parseFloat(e.target.value) : null })
                }
              />
            </div>

            {/* Category filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Category{" "}
                  {filters.categories.length > 0 && (
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {filters.categories.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Payment Type filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Payment{" "}
                  {filters.paymentTypes.length > 0 && (
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {filters.paymentTypes.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Payment Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {paymentTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={filters.paymentTypes.includes(type)}
                    onCheckedChange={() => handlePaymentTypeToggle(type)}
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
