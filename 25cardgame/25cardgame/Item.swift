//
//  Item.swift
//  25cardgame
//
//  Created by Patrick Scully on 4/2/2026.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
