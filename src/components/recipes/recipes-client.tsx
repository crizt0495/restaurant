"use client"

import * as React from "react"
import { createRecipe, updateRecipe, deleteRecipe } from "@/lib/actions/index"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import toast from "react-hot-toast"
import { Plus, Search, Pencil, Trash2, Loader2, BookOpen } from "lucide-react"

interface Product {
  id: string
  name: string
  selling_price: number
}

interface InventoryItem {
  id: string
  name: string
  unit: string
  cost_price: number
}

interface RecipeIngredient {
  inventory_item_id: string
  quantity: number
  unit: string
}

interface RecipeItem {
  id: string
  inventory_item_id: string
  quantity: number
  unit: string
  inventory_item?: { name: string; unit: string } | null
}

interface Recipe {
  id: string
  product_id: string
  name: string
  product?: { name: string } | null
  items?: RecipeItem[] | null
}

interface RecipesClientProps {
  recipes: Recipe[]
  products: Product[]
  inventoryItems: InventoryItem[]
  canCreate: boolean
  canEdit: boolean
}

export function RecipesClient({
  recipes,
  products,
  inventoryItems,
  canCreate,
  canEdit,
}: RecipesClientProps) {
  const [list, setList] = React.useState<Recipe[]>(recipes)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingRecipe, setEditingRecipe] = React.useState<Recipe | null>(null)
  const [selectedProductId, setSelectedProductId] = React.useState("")
  const [recipeName, setRecipeName] = React.useState("")
  const [ingredients, setIngredients] = React.useState<RecipeIngredient[]>([])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setList(recipes)
  }, [recipes])

  const filtered = list.filter((r) => {
    if (!search) return true
    const productName = r.product?.name || ""
    return (
      productName.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase())
    )
  })

  const getFoodCost = (recipe: Recipe) => {
    return (recipe.items || []).reduce((sum, item) => {
      const invItem = inventoryItems.find((i) => i.id === item.inventory_item_id)
      const cost = invItem ? Number(invItem.cost_price) : 0
      return sum + item.quantity * cost
    }, 0)
  }

  const getSellingPrice = (recipe: Recipe) => {
    const product = products.find((p) => p.id === recipe.product_id)
    return product ? Number(product.selling_price) : 0
  }

  const openCreate = () => {
    setEditingRecipe(null)
    setSelectedProductId("")
    setRecipeName("")
    setIngredients([])
    setDialogOpen(true)
  }

  const openEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setSelectedProductId(recipe.product_id)
    setRecipeName(recipe.name)
    setIngredients(
      (recipe.items || []).map((item) => ({
        inventory_item_id: item.inventory_item_id,
        quantity: Number(item.quantity),
        unit: item.unit,
      }))
    )
    setDialogOpen(true)
  }

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { inventory_item_id: "", quantity: 1, unit: "pcs" },
    ])
  }

  const updateIngredient = (
    index: number,
    patch: Partial<RecipeIngredient>
  ) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing))
    )
  }

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!selectedProductId) {
      toast.error("Pilih produk")
      return
    }
    const validIngredients = ingredients.filter((i) => i.inventory_item_id && i.quantity > 0)
    if (validIngredients.length === 0) {
      toast.error("Tambahkan minimal satu bahan")
      return
    }
    setSaving(true)
    const result = editingRecipe
      ? await updateRecipe(
          editingRecipe.id,
          selectedProductId,
          recipeName || `Resep ${products.find((p) => p.id === selectedProductId)?.name || ""}`,
          validIngredients
        )
      : await createRecipe(
          selectedProductId,
          recipeName || `Resep ${products.find((p) => p.id === selectedProductId)?.name || ""}`,
          validIngredients
        )
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editingRecipe ? "Resep diperbarui" : "Resep dibuat")
    setDialogOpen(false)
    window.location.reload()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus resep ${name}?`)) return
    const result = await deleteRecipe(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Resep dihapus")
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resep / BOM</h2>
          <p className="text-sm text-muted-foreground">
            Kelola resep dan biaya bahan produk
          </p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Resep
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari resep..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada resep</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">Bahan</TableHead>
                <TableHead className="text-right">Harga Pokok</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((recipe) => {
                const foodCost = getFoodCost(recipe)
                const sellingPrice = getSellingPrice(recipe)
                const margin =
                  sellingPrice > 0
                    ? ((sellingPrice - foodCost) / sellingPrice) * 100
                    : 0

                return (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">
                      {recipe.product?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber((recipe.items || []).length)} bahan
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(foodCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          margin >= 60
                            ? "success"
                            : margin >= 30
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {margin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(recipe)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() =>
                              handleDelete(recipe.id, recipe.product?.name || recipe.name)
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Recipe form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecipe ? "Edit Resep" : "Tambah Resep"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Produk</Label>
              <Select
                value={selectedProductId}
                onValueChange={(v) => setSelectedProductId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Nama Resep</Label>
              <Input
                placeholder="Opsional, default: Resep [nama produk]"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Bahan / Ingredients</Label>
              <div className="grid gap-2">
                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 items-center gap-2"
                  >
                    <Select
                      value={ing.inventory_item_id}
                      onValueChange={(v) => {
                        const item = inventoryItems.find((i) => i.id === v)
                        updateIngredient(index, {
                          inventory_item_id: v,
                          unit: item?.unit || "pcs",
                        })
                      }}
                    >
                      <SelectTrigger className="col-span-6">
                        <SelectValue placeholder="Pilih bahan" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) =>
                        updateIngredient(index, {
                          quantity: Number(e.target.value),
                        })
                      }
                    />
                    <Input
                      className="col-span-2"
                      placeholder="Unit"
                      value={ing.unit}
                      onChange={(e) =>
                        updateIngredient(index, { unit: e.target.value })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-1 h-7 w-7 text-destructive"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <div className="col-span-1 text-right text-xs text-muted-foreground">
                      {(() => {
                        const invItem = inventoryItems.find(
                          (i) => i.id === ing.inventory_item_id
                        )
                        return invItem
                          ? formatCurrency(ing.quantity * Number(invItem.cost_price))
                          : "-"
                      })()}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="mr-1 h-3 w-3" /> Tambah Bahan
              </Button>
            </div>

            {ingredients.length > 0 && (
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">Total Harga Pokok</span>
                <span className="text-lg font-bold">
                  {formatCurrency(
                    ingredients.reduce((sum, ing) => {
                      const invItem = inventoryItems.find(
                        (i) => i.id === ing.inventory_item_id
                      )
                      return sum + ing.quantity * (invItem ? Number(invItem.cost_price) : 0)
                    }, 0)
                  )}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
