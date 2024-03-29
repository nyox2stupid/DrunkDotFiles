// importing 
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Notifications from 'resource:///com/github/Aylur/ags/service/notifications.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';


// widgets can be only assigned as a child in one container
// so to make a reuseable widget, just make it a functiontt
// then you can use it by calling simply calling it

const Workspaces = () => Widget.Box({ 
    className: 'workspaces',
    connections: [[Hyprland.active.workspace, self => {
        // generate an array [1..10] then make buttons from the index
        let lengthhh = 5;
        const arr = Array.from({ length: lengthhh }, (_, i) => i + 1);
        self.children = arr.map(i => Widget.Button({
            onClicked: () => execAsync(`hyprctl dispatch workspace ${i}`),
            child: Widget.Label(`${i}`),
            className: Hyprland.active.workspace.id == i ? 'focused' : '',
        }));
    }]],
});

const ClientTitle = () => Widget.Label({
    className: 'client-title',
    binds: [
        ['label', Hyprland.active.client, 'title'],
    ],
});

const Clock = () => Widget.Label({
    className: 'clock',
    connections: [
        // this is bad practice, since exec() will block the main event loop
        // in the case of a simple date its not really a problem
        [1000, self => self.label = exec('date "+%H:%M:%S %b %e."')],

        // this is what you should do
        [1000, self => execAsync(['date', '+%H:%M:%S %b %e.'])
            .then(date => self.label = date).catch(console.error)],
    ],
});

// we don't need dunst or any other notification daemon
// because the Notifications module is a notification daemon itself
const Notification = () => Widget.Box({
    className: 'notification',
    children: [
        Widget.Icon({
            icon: 'preferences-system-notifications-symbolic',
            connections: [
                [Notifications, self => self.visible = Notifications.popups.length > 0],
            ],
        }),
        Widget.Label({
            connections: [[Notifications, self => {
                self.label = Notifications.popups[0]?.summary || '';
            }]],
        }),
    ],
});

const Media = () => Widget.Button({
    className: 'media',
    onPrimaryClick: () => Mpris.getPlayer('')?.playPause(),
    onScrollUp: () => Mpris.getPlayer('')?.next(),
    onScrollDown: () => Mpris.getPlayer('')?.previous(),
    child: Widget.Label({
        connections: [[Mpris, self => {
            const mpris = Mpris.getPlayer('');
            // mpris player can be undefined
            if (mpris)
                self.label = `${mpris.trackArtists.join(', ')} - ${mpris.trackTitle}`;
            else
                self.label = 'Nothing is playing';
        }]],
    }),
});

const BatteryLabel = () => Widget.Box({
    className: 'battery',
    children: [
        Widget.Label({
            binds: [
                ['label', Battery, 'percent', p => `${Math.floor(p)}% `],
            ],
            justification: 'left',
            truncate: 'end',
            xalign: 0,
            max_width_chars: 24,
            wrap: true,
            use_markup: true,
        }),
        Widget.Icon({
            connections: [[Battery, self => {
                self.icon = `battery-level-${Math.floor(Battery.percent / 10) * 10}-symbolic`;
            }]],
        }),
    ],
});


const SysTray = () => Widget.Box({
    connections: [[SystemTray, self => {
        self.children = SystemTray.items.map(item => Widget.Button({
            child: Widget.Icon({ binds: [['icon', item, 'icon']] }),
            onPrimaryClick: (_, event) => item.activate(event),
            onSecondaryClick: (_, event) => item.openMenu(event),
            binds: [['tooltip-markup', item, 'tooltip-markup']],
        }));
    }]],
});

// layout of the bar
const Left = () => Widget.Box({
    children: [
        Workspaces(),
        ClientTitle(),
    ],
});

const Center = () => Widget.Box({
    children: [
        Media(),
        Notification(),
    ],
});

const Right = () => Widget.Box({
    hpack: 'end',
    children: [
        BatteryLabel(),
        Clock(),
        SysTray(),
    ],
});

const Bar = ({ monitor } = {}) => Widget.Window({
    name: `bar-${monitor}`, // name has to be unique
    className: 'bar',
    monitor,
    anchor: ['top', 'left', 'right'],
    exclusive: true,
    child: Widget.CenterBox({
        startWidget: Left(),
        centerWidget: Center(),
        endWidget: Right(),
    }),
})

// exporting the config so ags can manage the windows
export default {
    style: App.configDir + '/style.css',
    windows: [
        Bar(),

        // you can call it, for each monitor
        // Bar({ monitor: 0 }),
        // Bar({ monitor: 1 })
    ],
};