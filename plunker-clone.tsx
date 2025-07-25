"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  ExternalLink,
  Pause,
  Plus,
  GitFork,
  Snowflake,
  FileText,
  File,
  Clock,
  User,
  Lock,
  Users,
  Building,
  BookOpen,
  Share2,
  LayoutTemplateIcon as Template,
} from "lucide-react"

export default function Component() {
  const [selectedFile, setSelectedFile] = useState("index.html")

  const [viewMode, setViewMode] = useState<"code" | "pwa">("code")
  const [selectedTab, setSelectedTab] = useState("ALL")
  const [appSettings, setAppSettings] = useState({
    name: "Employees",
    description: "",
    author: "",
    appUrl: "https://",
    accentColor: "#3B82F6",
    icon: "👥",
  })

  const employees = [
    {
      id: 1,
      name: "Michael Scott",
      title: "Regional Manager",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 2,
      name: "Dwight K. Schrute",
      title: "Assistant to the Regional Manager",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 3,
      name: "Pam Beesly",
      title: "Receptionist",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 4,
      name: "Jim Halpert",
      title: "Assistant Regional Manager",
      image: "/placeholder.svg?height=80&width=80",
    },
  ]

  const files = [
    { name: "index.html", icon: FileText },
    { name: "README.md", icon: FileText },
    { name: "script.js", icon: File },
    { name: "style.css", icon: File },
  ]

  const codeContent = `<!DOCTYPE html>
<html>
<head>
  <title>HTML5, CSS3 and JavaScript demo</title>
  <link rel="stylesheet" href="style.css" />
  <script src="https://code.createjs.com/createjs-2013.12.12.min.js"></script>
  <script src="script.js"></script>
</head>
<body onload="init();">
  <canvas id="canvas" width="500" height="500"></canvas>
</body>
<!-- Full tutorial at
     http://codingtips.kanishkkunal.in/draggable-shapes-canvas -->
</html>`

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-gray-600">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-medium">Plunker</span>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button variant="outline" size="sm" className="gap-1 bg-transparent">
              <Snowflake className="w-4 h-4" />
              Freeze
            </Button>
            <Button variant="outline" size="sm" className="gap-1 bg-transparent">
              <GitFork className="w-4 h-4" />
              Fork
            </Button>
            <Button variant="default" size="sm" className="gap-1 bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4" />
              New
            </Button>
            <Button variant="destructive" size="sm" className="gap-1">
              <Pause className="w-4 h-4" />
              Stop
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
            Sign in with Google
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* PWA Navigation */}
          {viewMode === "pwa" && (
            <div className="p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">APPS</div>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded bg-blue-100 text-blue-700">
                  <Users className="w-4 h-4" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Employees</div>
                    <div className="text-xs text-gray-500">433 users in last 30 days</div>
                  </div>
                </button>
              </div>
            </div>
          )}
          {/* Code Files (existing) */}
          {viewMode === "code" && (
            <div className="p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">FILES</div>
              <div className="space-y-1">
                {files.map((file) => {
                  const Icon = file.icon
                  return (
                    <button
                      key={file.name}
                      onClick={() => setSelectedFile(file.name)}
                      className={`w-full flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                        selectedFile === file.name ? "bg-blue-100 text-blue-700" : "text-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {file.name}
                    </button>
                  )
                })}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2 gap-1 bg-transparent">
                <Plus className="w-4 h-4" />
                New file
              </Button>
            </div>
          )}
          <Separator />
          {/* PWA Options */}
          {viewMode === "pwa" && (
            <div className="p-3">
              <div className="space-y-1">
                <button className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-gray-100 text-gray-700">
                  <Template className="w-4 h-4" />
                  Layout
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-gray-100 text-gray-700">
                  <BookOpen className="w-4 h-4" />
                  Tabs
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded bg-gray-100 text-gray-900">
                  <Users className="w-4 h-4" />
                  Settings
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-gray-100 text-gray-700">
                  <FileText className="w-4 h-4" />
                  Edit sheet
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-gray-100 text-gray-700">
                  <Download className="w-4 h-4" />
                  Reload sheet
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-gray-100 text-gray-700">
                  <Share2 className="w-4 h-4" />
                  Share app
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-gray-100 text-gray-700">
                  <Template className="w-4 h-4" />
                  Make template
                </button>
              </div>
            </div>
          )}
          <Separator />

          {/* Versions Section */}
          <div className="p-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              VERSIONS{" "}
              <Badge variant="secondary" className="text-xs">
                2
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Clock className="w-4 h-4" />
                <span>Updated about a minute ago</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Created 5 minutes ago</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Plunk Details */}
          <div className="p-3 flex-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">PLUNK</div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description:</label>
                <Textarea placeholder="Enter description..." className="min-h-[60px] text-sm resize-none" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tags:</label>
                <Input placeholder="Enter tags" className="text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">User:</label>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  Anonymous
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Privacy:</label>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Lock className="w-4 h-4" />
                  private plunk
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Mode Toggle */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <Button variant={viewMode === "code" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("code")}>
                Code Editor
              </Button>
              <Button variant={viewMode === "pwa" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("pwa")}>
                PWA Builder
              </Button>
            </div>
          </div>

          {viewMode === "code" ? (
            /* Existing Code Editor */
            <div className="flex-1 bg-white">
              <div className="h-full flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                  <span className="text-sm font-medium text-gray-700">{selectedFile}</span>
                </div>
                <div className="flex-1 font-mono text-sm overflow-auto">
                  <div className="flex">
                    <div className="bg-gray-50 border-r border-gray-200 px-3 py-4 text-gray-500 select-none">
                      {codeContent.split("\n").map((_, index) => (
                        <div key={index} className="leading-6">
                          {index + 1}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 p-4">
                      <pre className="leading-6 text-gray-800">
                        <code>{codeContent}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PWA Builder Interface */
            <div className="flex-1 bg-gray-50 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Mobile Preview */}
                  <div className="bg-black p-4 flex justify-center">
                    <div className="w-80 h-[600px] bg-white rounded-3xl p-4 shadow-2xl">
                      {/* Status Bar */}
                      <div className="flex justify-between items-center mb-4 text-xs">
                        <span className="font-medium">10:08</span>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-2 bg-black rounded-sm"></div>
                          <div className="w-4 h-2 border border-black rounded-sm"></div>
                          <div className="w-6 h-3 border border-black rounded-sm"></div>
                        </div>
                      </div>

                      {/* App Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">ℹ</span>
                        </div>
                        <h1 className="text-lg font-semibold">Employees</h1>
                        <button className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      {/* Search */}
                      <div className="mb-4">
                        <Input placeholder="Search" className="w-full" />
                      </div>

                      {/* Tabs */}
                      <div className="flex mb-4">
                        <button
                          className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
                            selectedTab === "ALL" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                          }`}
                          onClick={() => setSelectedTab("ALL")}
                        >
                          ALL
                        </button>
                        <button
                          className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
                            selectedTab === "FAVORITES" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                          }`}
                          onClick={() => setSelectedTab("FAVORITES")}
                        >
                          FAVORITES
                        </button>
                      </div>

                      {/* Employee Cards */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {employees.map((employee) => (
                          <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-3">
                            <img
                              src={employee.image || "/placeholder.svg"}
                              alt={employee.name}
                              className="w-full h-20 object-cover rounded-lg mb-2"
                            />
                            <h3 className="font-medium text-sm">{employee.name}</h3>
                            <p className="text-xs text-gray-500">{employee.title}</p>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Navigation */}
                      <div className="flex justify-around border-t border-gray-200 pt-2">
                        <button className="flex flex-col items-center gap-1 text-blue-500">
                          <Users className="w-5 h-5" />
                          <span className="text-xs">Employees</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 text-gray-400">
                          <Building className="w-5 h-5" />
                          <span className="text-xs">Offices</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 text-gray-400">
                          <BookOpen className="w-5 h-5" />
                          <span className="text-xs">Library</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {viewMode === "pwa" && (
            <div className="w-80 bg-white border-l border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>

              <div className="space-y-6">
                {/* Layout & Privacy Tabs */}
                <div className="flex border-b border-gray-200">
                  <button className="flex-1 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600">
                    LAYOUT
                  </button>
                  <button className="flex-1 py-2 text-sm font-medium text-gray-500">PRIVACY</button>
                </div>

                {/* Icon & Colors */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Icon</label>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl">
                      👥
                    </div>
                    <div className="text-sm text-gray-600">Accent color</div>
                  </div>

                  <div className="grid grid-cols-8 gap-2 mb-3">
                    {["#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899"].map(
                      (color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          onClick={() => setAppSettings({ ...appSettings, accentColor: color })}
                        />
                      ),
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Change
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Theme
                    </Button>
                  </div>
                </div>

                {/* About Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">ABOUT</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Name</label>
                      <Input
                        value={appSettings.name}
                        onChange={(e) => setAppSettings({ ...appSettings, name: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Description</label>
                      <Textarea
                        value={appSettings.description}
                        onChange={(e) => setAppSettings({ ...appSettings, description: e.target.value })}
                        className="text-sm min-h-[60px]"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Author</label>
                      <Input
                        value={appSettings.author}
                        onChange={(e) => setAppSettings({ ...appSettings, author: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">App URL</label>
                      <Input
                        value={appSettings.appUrl}
                        onChange={(e) => setAppSettings({ ...appSettings, appUrl: e.target.value })}
                        className="text-sm"
                      />
                      <div className="text-xs text-gray-500 mt-1">30 characters max</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
