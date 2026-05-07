'use client'

import { useState } from 'react'
import { 
  ArrowRight, 
  Check, 
  ChevronDown, 
  MoreHorizontal, 
  Trash2, 
  Edit,
  Star,
  AlertTriangle,
  Info
} from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
    <div className="flex flex-wrap gap-4">{children}</div>
  </section>
)

export default function SandboxPage() {
  const [progress, setProgress] = useState(65)
  const [checkboxChecked, setCheckboxChecked] = useState(false)
  const [radioValue, setRadioValue] = useState('option-1')

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">UI Component Sandbox</h1>
          <p className="text-slate-600">Testing all available shadcn/ui components</p>
        </div>

        {/* Buttons */}
        <Section title="Buttons">
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><ArrowRight className="h-4 w-4" /></Button>
        </Section>

        <Separator />

        {/* Inputs */}
        <Section title="Inputs">
          <div className="w-64 space-y-2">
            <Label htmlFor="input-1">Default Input</Label>
            <Input id="input-1" placeholder="Enter text..." />
          </div>
          <div className="w-64 space-y-2">
            <Label htmlFor="input-2">With Value</Label>
            <Input id="input-2" defaultValue="Pre-filled value" />
          </div>
          <div className="w-64 space-y-2">
            <Label htmlFor="input-3">Disabled</Label>
            <Input id="input-3" disabled placeholder="Disabled input" />
          </div>
          <div className="w-64 space-y-2">
            <Label htmlFor="input-4">Type Number</Label>
            <Input id="input-4" type="number" placeholder="123" />
          </div>
        </Section>

        <Separator />

        {/* Textarea */}
        <Section title="Textarea">
          <div className="w-80 space-y-2">
            <Label htmlFor="textarea-1">Default Textarea</Label>
            <Textarea id="textarea-1" placeholder="Enter description..." />
          </div>
          <div className="w-80 space-y-2">
            <Label htmlFor="textarea-2">With Value</Label>
            <Textarea id="textarea-2" defaultValue="This is a pre-filled textarea with some content." />
          </div>
          <div className="w-80 space-y-2">
            <Label htmlFor="textarea-3">Disabled</Label>
            <Textarea id="textarea-3" disabled placeholder="Disabled textarea" />
          </div>
        </Section>

        <Separator />

        {/* Cards */}
        <Section title="Cards">
          <Card className="w-80">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">This is the card content area where you can add any content.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">Cancel</Button>
              <Button size="sm">Confirm</Button>
            </CardFooter>
          </Card>

          <Card className="w-80">
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Just a card with content</p>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        {/* Badges */}
        <Section title="Badges">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge>With Icon <Star className="ml-1 h-3 w-3" /></Badge>
        </Section>

        <Separator />

        {/* Progress */}
        <Section title="Progress">
          <div className="w-64 space-y-2">
            <Label>Progress: {progress}%</Label>
            <Progress value={progress} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
              <Button size="sm" variant="outline" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
            </div>
          </div>
          <div className="w-64 space-y-2">
            <Label>0%</Label>
            <Progress value={0} />
          </div>
          <div className="w-64 space-y-2">
            <Label>100%</Label>
            <Progress value={100} />
          </div>
        </Section>

        <Separator />

        {/* Checkbox */}
        <Section title="Checkbox">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="checkbox-1" 
              checked={checkboxChecked}
              onCheckedChange={(checked) => setCheckboxChecked(checked as boolean)}
            />
            <Label htmlFor="checkbox-1">I agree to the terms</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="checkbox-2" disabled />
            <Label htmlFor="checkbox-2" className="opacity-50">Disabled checkbox</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="checkbox-3" checked />
            <Label htmlFor="checkbox-3">Checked checkbox</Label>
          </div>
        </Section>

        <Separator />

        {/* RadioGroup */}
        <Section title="RadioGroup">
          <div className="space-y-2">
            <Label>Select an option</Label>
            <RadioGroup value={radioValue} onValueChange={setRadioValue}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-1" id="radio-1" />
                <Label htmlFor="radio-1">Option 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-2" id="radio-2" />
                <Label htmlFor="radio-2">Option 2</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-3" id="radio-3" />
                <Label htmlFor="radio-3">Option 3</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Disabled RadioGroup</Label>
            <RadioGroup disabled defaultValue="option-a">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-a" id="radio-a" />
                <Label htmlFor="radio-a">Option A</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-b" id="radio-b" />
                <Label htmlFor="radio-b">Option B</Label>
              </div>
            </RadioGroup>
          </div>
        </Section>

        <Separator />

        {/* Select */}
        <Section title="Select">
          <div className="w-64 space-y-2">
            <Label>Select an item</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option-1">Option 1</SelectItem>
                <SelectItem value="option-2">Option 2</SelectItem>
                <SelectItem value="option-3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-64 space-y-2">
            <Label>With default value</Label>
            <Select defaultValue="option-2">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option-1">Option 1</SelectItem>
                <SelectItem value="option-2">Option 2</SelectItem>
                <SelectItem value="option-3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-64 space-y-2">
            <Label>Disabled</Label>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Disabled" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option-1">Option 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Separator />

        {/* DropdownMenu */}
        <Section title="DropdownMenu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Menu <ChevronDown className="ml-2 h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Change Password</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
              <DropdownMenuItem><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        <Separator />

        {/* Dialog */}
        <Section title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is a dialog description. It explains what this dialog is about.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-slate-600">
                  Here you can add any content to the dialog. It could be a form, 
                  additional information, or anything else.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Confirm</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Small Dialog</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="John Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="john@example.com" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </Section>

        <Separator />

        {/* AlertDialog */}
        <Section title="AlertDialog">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account 
                  and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700">Yes, delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Confirm Action</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Continue with action?</AlertDialogTitle>
                <AlertDialogDescription>
                  Please confirm to proceed with this action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        <Separator />

        {/* Tabs */}
        <Section title="Tabs">
          <Tabs defaultValue="account" className="w-[400px]">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Manage your account settings here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Account settings content goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Change your password here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Password change form goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Configure your preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Settings content goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        <Separator />

        {/* Table */}
        <Section title="Table">
          <Table className="w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">John Doe</TableCell>
                <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                <TableCell>Admin</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Jane Smith</TableCell>
                <TableCell><Badge>Active</Badge></TableCell>
                <TableCell>User</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bob Johnson</TableCell>
                <TableCell><Badge variant="destructive">Inactive</Badge></TableCell>
                <TableCell>User</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>

        <Separator />

        {/* Labels */}
        <Section title="Labels (standalone)">
          <Label>Simple Label</Label>
          <Label className="text-red-600">Colored Label</Label>
          <Label className="text-sm text-slate-500">Small muted Label</Label>
        </Section>

        <Separator />

        {/* Separator (standalone) */}
        <Section title="Separator">
          <div className="w-64 space-y-2">
            <p className="text-sm">Content above</p>
            <Separator />
            <p className="text-sm">Content below</p>
          </div>
          <div className="w-64 space-y-2">
            <p className="text-sm">With orientation</p>
            <Separator orientation="horizontal" />
            <p className="text-sm">More content</p>
          </div>
        </Section>

        <Separator />

        {/* Combined Example */}
        <Section title="Combined Example - Form Card">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Question</CardTitle>
              <CardDescription>Enter the details for your new quiz question.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question Text</Label>
                <Textarea id="question" placeholder="Enter your question here..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <RadioGroup defaultValue="medium">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="diff-easy" />
                    <Label htmlFor="diff-easy">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="diff-medium" />
                    <Label htmlFor="diff-medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="diff-hard" />
                    <Label htmlFor="diff-hard">Hard</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="required" />
                <Label htmlFor="required">Required question</Label>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Create Question</Button>
            </CardFooter>
          </Card>
        </Section>
      </div>
    </div>
  )
}